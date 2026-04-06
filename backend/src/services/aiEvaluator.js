function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

const tokenRegex = /[A-Za-z_][A-Za-z0-9_]*/g;

function normalize(text) {
  return String(text || "").toLowerCase();
}

function collectTokens(source) {
  return new Set((normalize(source).match(tokenRegex) || []).filter((token) => token.length > 2));
}

function overlapRatio(a, b) {
  if (!a.size) {
    return 0;
  }

  let shared = 0;
  for (const token of a) {
    if (b.has(token)) {
      shared += 1;
    }
  }

  return shared / a.size;
}

function inferComplexityLevel(code) {
  const normalized = normalize(code);
  const loops = (normalized.match(/\bfor\b|\bwhile\b/g) || []).length;
  const recursion = normalized.includes("def ") || normalized.includes("function") || normalized.includes("main(")
    ? (() => {
        const lines = normalized.split("\n");
        return lines.some((line) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return false;
          }
          return /\breturn\b/.test(trimmed) && /\w+\(/.test(trimmed);
        });
      })()
    : false;

  if (loops >= 2) {
    return 3;
  }
  if (loops === 1 || recursion) {
    return 2;
  }
  return 1;
}

function hasDataStructureSignals(code) {
  const normalized = normalize(code);
  return (
    normalized.includes("[") ||
    normalized.includes("{") ||
    normalized.includes("array") ||
    normalized.includes("vector") ||
    normalized.includes("list") ||
    normalized.includes("map") ||
    normalized.includes("set")
  );
}

function scoreReadability(userCode) {
  const lines = String(userCode || "").split("\n");
  const nonEmpty = lines.filter((line) => line.trim().length > 0);
  const avgLineLength = nonEmpty.length
    ? nonEmpty.reduce((acc, line) => acc + line.length, 0) / nonEmpty.length
    : 0;
  const hasIndentation = nonEmpty.some((line) => /^\s{2,}|\t+/.test(line));
  const hasComments = nonEmpty.some((line) => line.trim().startsWith("//") || line.trim().startsWith("/*") || line.trim().startsWith("#"));
  const readableLengthScore = avgLineLength > 0 && avgLineLength <= 90 ? 7 : avgLineLength <= 120 ? 5 : 3;

  return clamp(readableLengthScore + (hasIndentation ? 5 : 2) + (hasComments ? 3 : 1), 0, 15);
}

function buildFeedback({ functionalEquivalence, logicalCorrectness, timeComplexitySimilarity, spaceComplexitySimilarity, readability }) {
  const notes = [];

  if (functionalEquivalence < 20) {
    notes.push("Your translation appears to miss parts of the original behavior.");
  } else if (functionalEquivalence < 32) {
    notes.push("Core behavior is partially captured; verify edge cases and input handling.");
  } else {
    notes.push("Behavior mapping from Python looks strong overall.");
  }

  if (logicalCorrectness < 12) {
    notes.push("Add clearer control-flow logic to match Python branches and loops.");
  }
  if (timeComplexitySimilarity < 8) {
    notes.push("Try matching the original algorithmic approach to keep complexity similar.");
  }
  if (spaceComplexitySimilarity < 6) {
    notes.push("Reduce extra temporary containers to improve space behavior.");
  }
  if (readability < 8) {
    notes.push("Improve naming and formatting for readability.");
  }

  return notes.join(" ");
}

function localEvaluate(sourcePython, userCode, targetLanguage) {
  const normalizedSource = normalize(sourcePython);
  const normalizedUser = normalize(userCode);

  const pyTokens = collectTokens(sourcePython);
  const userTokens = collectTokens(userCode);
  const tokenOverlap = overlapRatio(pyTokens, userTokens);

  const sourceHasInput = normalizedSource.includes("input(");
  const sourceHasOutput = normalizedSource.includes("print(");
  const userHasInputSignal =
    normalizedUser.includes("scanf") ||
    normalizedUser.includes("cin") ||
    normalizedUser.includes("scanner") ||
    normalizedUser.includes("readline") ||
    normalizedUser.includes("fs.readfilesync") ||
    normalizedUser.includes("prompt(");
  const userHasOutputSignal =
    normalizedUser.includes("printf") ||
    normalizedUser.includes("cout") ||
    normalizedUser.includes("system.out") ||
    normalizedUser.includes("console.log");

  const sourceComplexity = inferComplexityLevel(sourcePython);
  const userComplexity = inferComplexityLevel(userCode);
  const complexityGap = Math.abs(sourceComplexity - userComplexity);

  const sourceSpace = hasDataStructureSignals(sourcePython) ? 2 : 1;
  const userSpace = hasDataStructureSignals(userCode) ? 2 : 1;
  const spaceGap = Math.abs(sourceSpace - userSpace);

  const languageSignalBonus = (() => {
    if (targetLanguage === "javascript" && normalizedUser.includes("console.log")) return 2;
    if (targetLanguage === "java" && normalizedUser.includes("system.out")) return 2;
    if ((targetLanguage === "c" || targetLanguage === "cpp") && (normalizedUser.includes("printf") || normalizedUser.includes("cout"))) return 2;
    return 0;
  })();

  return {
    functionalEquivalence: clamp(Number((12 + tokenOverlap * 24 + (sourceHasOutput && userHasOutputSignal ? 4 : 0)).toFixed(2)), 0, 40),
    logicalCorrectness: clamp(Number((6 + tokenOverlap * 10 + (sourceHasInput ? (userHasInputSignal ? 4 : 0) : 2) + languageSignalBonus).toFixed(2)), 0, 20),
    timeComplexitySimilarity: clamp(Number((15 - complexityGap * 4).toFixed(2)), 0, 15),
    spaceComplexitySimilarity: clamp(Number((10 - spaceGap * 3).toFixed(2)), 0, 10),
    readability: scoreReadability(userCode)
  };
}

export async function evaluateWithAi({ sourcePython, userCode, targetLanguage }) {
  const localScore = localEvaluate(sourcePython, userCode, targetLanguage);
  const openAiApiKey = process.env.OPENAI_API_KEY || process.env.API;

  if (!openAiApiKey) {
    return {
      ...localScore,
      feedback: `${buildFeedback(localScore)} OpenAI API key not configured, so fallback scoring was used.`
    };
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const prompt = `Evaluate this translated solution and return strict JSON only.

Source Python:
${sourcePython}

Target language:
${targetLanguage}

User code:
${userCode}

Return:
{
  "functionalEquivalence": number,
  "logicalCorrectness": number,
  "timeComplexitySimilarity": number,
  "spaceComplexitySimilarity": number,
  "readability": number,
  "feedback": "short constructive feedback"
}

Score ranges:
- functionalEquivalence: 0-40
- logicalCorrectness: 0-20
- timeComplexitySimilarity: 0-15
- spaceComplexitySimilarity: 0-10
- readability: 0-15`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a strict programming evaluator. Return only valid JSON." },
          { role: "user", content: prompt }
        ]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const json = await response.json();
    const payload = JSON.parse(json.choices?.[0]?.message?.content || "{}");
    return {
      functionalEquivalence: clamp(payload.functionalEquivalence, 0, 40),
      logicalCorrectness: clamp(payload.logicalCorrectness, 0, 20),
      timeComplexitySimilarity: clamp(payload.timeComplexitySimilarity, 0, 15),
      spaceComplexitySimilarity: clamp(payload.spaceComplexitySimilarity, 0, 10),
      readability: clamp(payload.readability, 0, 15),
      feedback: String(payload.feedback || buildFeedback(localScore))
    };
  } catch {
    return {
      ...localScore,
      feedback: `${buildFeedback(localScore)} OpenAI scoring failed, so fallback scoring was used.`
    };
  }
}
