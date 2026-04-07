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

function extractGeminiText(responseJson) {
  const raw = responseJson?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractOpenRouterText(responseJson) {
  const content = responseJson?.choices?.[0]?.message?.content;
  const raw = Array.isArray(content)
    ? content.map((part) => (typeof part === "string" ? part : part?.text || "")).join("")
    : String(content || "");

  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function isOpenRouterKey(apiKey = "") {
  return String(apiKey || "").trim().startsWith("sk-or-");
}

async function callGeminiJson({ apiKey, model, prompt, timeoutMs = 30000 }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1
          }
        }),
        signal: controller.signal
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    const text = extractGeminiText(json);
    return JSON.parse(text || "{}");
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callOpenRouterJson({ apiKey, model, prompt, timeoutMs = 30000 }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL?.split(",")?.[0] || "http://localhost:5173",
        "X-Title": "Code Translation Arena"
      },
      body: JSON.stringify({
        model: model || process.env.OPENROUTER_MODEL || "openrouter/free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    const text = extractOpenRouterText(json);
    return JSON.parse(text || "{}");
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callProviderJson({ apiKey, model, prompt, timeoutMs = 30000 }) {
  if (isOpenRouterKey(apiKey)) {
    return callOpenRouterJson({
      apiKey,
      model: process.env.OPENROUTER_MODEL || "openrouter/free",
      prompt,
      timeoutMs
    });
  }

  return callGeminiJson({ apiKey, model, prompt, timeoutMs });
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
    normalizedUser.includes("bufio.newscanner") ||
    normalizedUser.includes("read_line") ||
    normalizedUser.includes("stdin") ||
    normalizedUser.includes("readline") ||
    normalizedUser.includes("fs.readfilesync") ||
    normalizedUser.includes("prompt(");
  const userHasOutputSignal =
    normalizedUser.includes("printf") ||
    normalizedUser.includes("cout") ||
    normalizedUser.includes("system.out") ||
    normalizedUser.includes("fmt.println") ||
    normalizedUser.includes("println!") ||
    normalizedUser.includes("println(") ||
    normalizedUser.includes("console.log");

  const sourceComplexity = inferComplexityLevel(sourcePython);
  const userComplexity = inferComplexityLevel(userCode);
  const complexityGap = Math.abs(sourceComplexity - userComplexity);

  const sourceSpace = hasDataStructureSignals(sourcePython) ? 2 : 1;
  const userSpace = hasDataStructureSignals(userCode) ? 2 : 1;
  const spaceGap = Math.abs(sourceSpace - userSpace);

  const languageSignalBonus = (() => {
    if (targetLanguage === "go" && (normalizedUser.includes("fmt.println") || normalizedUser.includes("fmt.print"))) return 2;
    if (targetLanguage === "rust" && normalizedUser.includes("println!")) return 2;
    if (targetLanguage === "kotlin" && normalizedUser.includes("println(")) return 2;
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
  const apiKey = process.env.API;

  if (!apiKey) {
    return {
      ...localScore,
      feedback: `${buildFeedback(localScore)} API key not configured, so fallback scoring was used.`
    };
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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
    const payload = await callProviderJson({
      apiKey,
      model,
      prompt: `You are a strict programming evaluator. Return only valid JSON.\n\n${prompt}`
    });
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
      feedback: `${buildFeedback(localScore)} API scoring failed, so fallback scoring was used.`
    };
  }
}

export async function evaluateTestCasesWithAi({ sourcePython, userCode, targetLanguage, testCases, questionTitle = "" }) {
  const apiKey = process.env.API;
  if (!apiKey) {
    return {
      passed: 0,
      total: Array.isArray(testCases) ? testCases.length : 0,
      accuracyScore: 0,
      details: (testCases || []).map((testCase) => ({
        stdin: testCase.stdin,
        expectedOutput: String(testCase.expectedOutput || "").trim(),
        actualOutput: "[api key not configured]",
        status: "API key not configured",
        passed: false
      })),
      compileError: "",
      runtimeError: "API key not configured for testcase evaluation.",
      evaluationMode: "ai-required",
      diagnostics: {
        structureScore: 0,
        languageScore: 0,
        questionScore: 0,
        ioScore: 0,
        missingQuestionSignals: [],
        languageWarnings: [],
        ioWarnings: []
      }
    };
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `You are evaluating whether a translated program would pass the following hidden testcases.

Question title:
${questionTitle}

Source Python:
${sourcePython}

Target language:
${targetLanguage}

User code:
${userCode}

Testcases:
${JSON.stringify(testCases || [], null, 2)}

Return strict JSON only in this shape:
{
  "passed": number,
  "total": number,
  "details": [
    {
      "stdin": "string",
      "expectedOutput": "string",
      "actualOutput": "short explanation or predicted output",
      "status": "Passed or Failed with short reason",
      "passed": true
    }
  ],
  "diagnostics": {
    "structureScore": number,
    "languageScore": number,
    "questionScore": number,
    "ioScore": number,
    "missingQuestionSignals": ["string"],
    "languageWarnings": ["string"],
    "ioWarnings": ["string"]
  }
}

Rules:
- Be strict.
- Mark a testcase passed only if you are highly confident.
- If the code is incomplete, syntactically broken, or likely wrong, fail the testcase.
- Keep diagnostics scores in the range 0-100.`;

  try {
    const payload = await callProviderJson({
      apiKey,
      model,
      prompt: `You are a strict testcase evaluator. Return only valid JSON.\n\n${prompt}`,
      timeoutMs: 45000
    });

    const normalizedDetails = (payload.details || []).slice(0, (testCases || []).length).map((item, index) => ({
      stdin: String(item.stdin ?? testCases[index]?.stdin ?? ""),
      expectedOutput: String(item.expectedOutput ?? testCases[index]?.expectedOutput ?? "").trim(),
      actualOutput: String(item.actualOutput ?? "[not provided]").trim(),
      status: String(item.status ?? (item.passed ? "Passed" : "Failed")).trim(),
      passed: Boolean(item.passed)
    }));
    const total = Array.isArray(testCases) ? testCases.length : 0;
    const passed = normalizedDetails.filter((item) => item.passed).length;

    while (normalizedDetails.length < total) {
      const testCase = testCases[normalizedDetails.length];
      normalizedDetails.push({
        stdin: String(testCase?.stdin || ""),
        expectedOutput: String(testCase?.expectedOutput || "").trim(),
        actualOutput: "[not evaluated]",
        status: "Failed: incomplete API evaluation",
        passed: false
      });
    }

    return {
      passed,
      total,
      accuracyScore: total ? Number(((passed / total) * 100).toFixed(2)) : 0,
      details: normalizedDetails,
      compileError: "",
      runtimeError: "",
      evaluationMode: "ai-testcase-eval",
      diagnostics: {
        structureScore: clamp(payload.diagnostics?.structureScore, 0, 100),
        languageScore: clamp(payload.diagnostics?.languageScore, 0, 100),
        questionScore: clamp(payload.diagnostics?.questionScore, 0, 100),
        ioScore: clamp(payload.diagnostics?.ioScore, 0, 100),
        missingQuestionSignals: Array.isArray(payload.diagnostics?.missingQuestionSignals) ? payload.diagnostics.missingQuestionSignals.map(String) : [],
        languageWarnings: Array.isArray(payload.diagnostics?.languageWarnings) ? payload.diagnostics.languageWarnings.map(String) : [],
        ioWarnings: Array.isArray(payload.diagnostics?.ioWarnings) ? payload.diagnostics.ioWarnings.map(String) : []
      }
    };
  } catch (error) {
    return {
      passed: 0,
      total: Array.isArray(testCases) ? testCases.length : 0,
      accuracyScore: 0,
      details: (testCases || []).map((testCase) => ({
        stdin: testCase.stdin,
        expectedOutput: String(testCase.expectedOutput || "").trim(),
        actualOutput: "[api evaluation failed]",
        status: "API evaluation failed",
        passed: false
      })),
      compileError: "",
      runtimeError: String(error.message || "API evaluation failed").slice(0, 500),
      evaluationMode: "ai-required",
      diagnostics: {
        structureScore: 0,
        languageScore: 0,
        questionScore: 0,
        ioScore: 0,
        missingQuestionSignals: [],
        languageWarnings: [],
        ioWarnings: []
      }
    };
  }
}

export async function compileWithAi({ sourcePython, userCode, targetLanguage, questionTitle = "" }) {
  const apiKey = process.env.API;
  const localMessages = [];
  const trimmed = String(userCode || "").trim();

  if (!trimmed) {
    return { ok: false, messages: ["Code is empty."] };
  }

  if (!apiKey) {
    return {
      ok: false,
      messages: ["API key not configured for compile analysis."]
    };
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `You are checking whether this translated solution is likely to compile for the selected language.

Question title:
${questionTitle}

Source Python:
${sourcePython}

Target language:
${targetLanguage}

User code:
${userCode}

Return strict JSON only:
{
  "ok": true,
  "messages": ["short compile messages"]
}

Rules:
- Be strict.
- If the code is clearly incomplete or syntactically invalid, set ok to false.
- Keep messages short and concrete.`;

  try {
    const payload = await callProviderJson({
      apiKey,
      model,
      prompt: `You are a strict compile checker. Return only valid JSON.\n\n${prompt}`
    });

    const messages = Array.isArray(payload.messages) ? payload.messages.map((item) => String(item)) : [];
    return {
      ok: Boolean(payload.ok),
      messages: messages.length ? messages : [payload.ok ? "Compile analysis passed." : "Compile analysis failed."]
    };
  } catch (error) {
    localMessages.push(String(error.message || "Compile analysis failed").slice(0, 300));
    return {
      ok: false,
      messages: localMessages
    };
  }
}

export async function runCodeWithAi({ sourcePython, userCode, targetLanguage, stdin = "", questionTitle = "" }) {
  const apiKey = process.env.API;

  if (!String(userCode || "").trim()) {
    return {
      output: "",
      notes: "Code is empty."
    };
  }

  if (!apiKey) {
    return {
      output: "",
      notes: "API key not configured for run preview."
    };
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `You are simulating the output of the translated code for a run-preview feature.

Question title:
${questionTitle}

Source Python:
${sourcePython}

Target language:
${targetLanguage}

User code:
${userCode}

stdin:
${stdin}

Return strict JSON only:
{
  "output": "predicted stdout exactly as the program would print",
  "notes": "short note if there is uncertainty, likely bug, or runtime issue"
}

Rules:
- Be conservative.
- If the code appears incomplete or broken, output can be empty and notes should explain why.
- Do not wrap JSON in markdown.`;

  try {
    const payload = await callProviderJson({
      apiKey,
      model,
      prompt: `You are a strict code execution simulator. Return only valid JSON.\n\n${prompt}`,
      timeoutMs: 45000
    });

    return {
      output: String(payload.output || "").trim(),
      notes: String(payload.notes || "Run preview completed.")
    };
  } catch (error) {
    return {
      output: "",
      notes: String(error.message || "Run preview failed").slice(0, 300)
    };
  }
}
