import axios from "axios";
import { languageMap } from "../utils/languageMap.js";

const pollDelayMs = 1200;
const maxPollTries = 25;

function getJudgeHeaders() {
  return {
    "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
    "X-RapidAPI-Host": new URL(process.env.JUDGE0_BASE_URL).host,
    "Content-Type": "application/json"
  };
}

async function delay(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runSingleCase({ sourceCode, language, stdin }) {
  const languageMeta = languageMap[language];
  if (!languageMeta) {
    throw new Error("Unsupported language");
  }

  if (!process.env.JUDGE0_API_KEY) {
    return { stdout: "", stderr: "Judge0 API key missing", status: { id: 6, description: "Compile Error" } };
  }

  const submitResponse = await axios.post(
    `${process.env.JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=false`,
    {
      source_code: sourceCode,
      language_id: languageMeta.judge0Id,
      stdin,
      cpu_time_limit: 2,
      memory_limit: 128000
    },
    { headers: getJudgeHeaders(), timeout: 15000 }
  );

  const { token } = submitResponse.data;

  for (let attempt = 0; attempt < maxPollTries; attempt += 1) {
    await delay(pollDelayMs);

    const resultResponse = await axios.get(
      `${process.env.JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=false`,
      { headers: getJudgeHeaders(), timeout: 15000 }
    );

    const result = resultResponse.data;
    if (result.status?.id > 2) {
      return result;
    }
  }

  return { stdout: "", stderr: "Execution timed out while polling", status: { id: 13, description: "Internal Error" } };
}

export async function evaluateWithJudge0({ sourceCode, language, testCases }) {
  const details = [];
  let passed = 0;
  let compileError = "";
  let runtimeError = "";

  for (const testCase of testCases) {
    const result = await runSingleCase({ sourceCode, language, stdin: testCase.stdin });
    const stdout = (result.stdout || "").trim();
    const expected = (testCase.expectedOutput || "").trim();

    const isAccepted = result.status?.id === 3;
    const casePassed = isAccepted && stdout === expected;

    if (casePassed) {
      passed += 1;
    }

    if (!isAccepted && !compileError && result.compile_output) {
      compileError = result.compile_output;
    }

    if (!isAccepted && !runtimeError && (result.stderr || result.message)) {
      runtimeError = result.stderr || result.message;
    }

    details.push({
      stdin: testCase.stdin,
      expectedOutput: expected,
      actualOutput: stdout,
      status: result.status?.description || "Unknown",
      passed: casePassed
    });
  }

  return {
    passed,
    total: testCases.length,
    accuracyScore: Number(((passed / testCases.length) * 100).toFixed(2)),
    details,
    compileError: compileError.slice(0, 500),
    runtimeError: runtimeError.slice(0, 500)
  };
}
