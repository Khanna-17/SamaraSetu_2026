import axios from "axios";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function normalizeScores(payload) {
  return {
    functionalEquivalence: clamp(payload.functionalEquivalence, 0, 40),
    logicalCorrectness: clamp(payload.logicalCorrectness, 0, 20),
    timeComplexitySimilarity: clamp(payload.timeComplexitySimilarity, 0, 15),
    spaceComplexitySimilarity: clamp(payload.spaceComplexitySimilarity, 0, 10),
    readability: clamp(payload.readability, 0, 15),
    feedback: String(payload.feedback || "Good attempt. Keep refining edge cases and variable naming.")
  };
}

function fallbackEvaluation(sourcePython, userCode) {
  const lenRatio = Math.min(1, userCode.length / Math.max(sourcePython.length, 1));
  const signal = userCode.includes("for") || userCode.includes("while") || userCode.includes("if");

  return {
    functionalEquivalence: Number((22 + lenRatio * 10).toFixed(2)),
    logicalCorrectness: signal ? 12 : 8,
    timeComplexitySimilarity: 8,
    spaceComplexitySimilarity: 6,
    readability: 9,
    feedback: "Fallback AI score used because OpenAI key is missing or response parse failed."
  };
}

export async function evaluateWithAi({ sourcePython, userCode, targetLanguage }) {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackEvaluation(sourcePython, userCode);
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const prompt = `You are evaluating code translation quality.\n\nSource Python:\n${sourcePython}\n\nTranslated ${targetLanguage} code:\n${userCode}\n\nReturn strict JSON only with this shape:\n{\n  \"functionalEquivalence\": number 0-40,\n  \"logicalCorrectness\": number 0-20,\n  \"timeComplexitySimilarity\": number 0-15,\n  \"spaceComplexitySimilarity\": number 0-10,\n  \"readability\": number 0-15,\n  \"feedback\": \"short constructive feedback\"\n}`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a strict code evaluation engine." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const content = response.data.choices?.[0]?.message?.content || "{}";
    return normalizeScores(JSON.parse(content));
  } catch {
    return fallbackEvaluation(sourcePython, userCode);
  }
}
