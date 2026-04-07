function normalizeOutput(text) {
  return String(text || "").replace(/\r\n/g, "\n").trim();
}

const pistonLanguageMap = {
  c: { language: "c", version: "*" },
  cpp: { language: "c++", version: "*" },
  java: { language: "java", version: "*" },
  javascript: { language: "javascript", version: "*" },
  go: { language: "go", version: "*" },
  rust: { language: "rust", version: "*" },
  kotlin: { language: "kotlin", version: "*" }
};

function getPistonBaseUrl() {
  return String(process.env.PISTON_URL || "").replace(/\/+$/, "");
}

function getPistonRuntime(language) {
  return pistonLanguageMap[String(language || "").trim().toLowerCase()] || null;
}

function buildMainFile(language, sourceCode) {
  const normalized = String(language || "").trim().toLowerCase();
  const filename =
    normalized === "c" ? "main.c" :
    normalized === "cpp" ? "main.cpp" :
    normalized === "java" ? "Main.java" :
    normalized === "javascript" ? "main.js" :
    normalized === "go" ? "main.go" :
    normalized === "rust" ? "main.rs" :
    normalized === "kotlin" ? "Main.kt" :
    "main.txt";

  return {
    name: filename,
    content: String(sourceCode || "")
  };
}

async function executeWithPiston({ sourceCode, language, stdin = "" }) {
  const baseUrl = getPistonBaseUrl();
  const runtime = getPistonRuntime(language);

  if (!baseUrl || !runtime) {
    throw new Error("Piston is not configured.");
  }

  const response = await fetch(`${baseUrl}/api/v2/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      language: runtime.language,
      version: runtime.version,
      files: [buildMainFile(language, sourceCode)],
      stdin: String(stdin || ""),
      compile_timeout: 10000,
      run_timeout: 3000,
      compile_cpu_time: 10000,
      run_cpu_time: 3000,
      compile_memory_limit: 268435456,
      run_memory_limit: 268435456
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Piston request failed with status ${response.status}: ${text}`);
  }

  return response.json();
}

function getCompileFailureMessage(result) {
  const compile = result?.compile || {};
  if (compile.code && compile.code !== 0) {
    return String(compile.stderr || compile.output || compile.message || "Compilation failed").trim();
  }
  return "";
}

function getRunFailureMessage(result) {
  const run = result?.run || {};
  if (run.code && run.code !== 0) {
    return String(run.stderr || run.output || run.message || "Runtime failed").trim();
  }
  if (run.signal) {
    return `Process terminated by signal ${run.signal}`;
  }
  if (run.status) {
    return String(run.message || run.status).trim();
  }
  return "";
}

export function isPistonConfigured() {
  return Boolean(getPistonBaseUrl());
}

export async function compileWithPiston({ sourceCode, language }) {
  const result = await executeWithPiston({ sourceCode, language, stdin: "" });
  const compileError = getCompileFailureMessage(result);
  const runIssue = compileError ? "" : getRunFailureMessage(result);

  if (compileError) {
    return { ok: false, messages: [compileError] };
  }

  if (runIssue) {
    return { ok: true, messages: ["Compilation passed.", `Runtime note: ${runIssue}`] };
  }

  return { ok: true, messages: ["Compilation passed."] };
}

export async function runWithPiston({ sourceCode, language, stdin = "" }) {
  const result = await executeWithPiston({ sourceCode, language, stdin });
  const compileError = getCompileFailureMessage(result);
  if (compileError) {
    return {
      output: "",
      notes: compileError
    };
  }

  const runIssue = getRunFailureMessage(result);
  return {
    output: normalizeOutput(result?.run?.stdout || ""),
    notes: runIssue || "Run completed."
  };
}

export async function evaluateWithPiston({ sourceCode, language, testCases }) {
  if (!Array.isArray(testCases) || !testCases.length) {
    return {
      passed: 0,
      total: 0,
      accuracyScore: 0,
      details: [],
      compileError: "",
      runtimeError: "No test cases configured for this question.",
      evaluationMode: "piston"
    };
  }

  const details = [];
  let passed = 0;
  let compileError = "";
  let runtimeError = "";

  for (const testCase of testCases) {
    const result = await executeWithPiston({
      sourceCode,
      language,
      stdin: String(testCase.stdin || "")
    });

    const currentCompileError = getCompileFailureMessage(result);
    const currentRunError = currentCompileError ? "" : getRunFailureMessage(result);
    const actualOutput = normalizeOutput(result?.run?.stdout || "");
    const expectedOutput = normalizeOutput(testCase.expectedOutput);
    const casePassed = !currentCompileError && !currentRunError && actualOutput === expectedOutput;

    if (!compileError && currentCompileError) {
      compileError = currentCompileError.slice(0, 500);
    }
    if (!runtimeError && currentRunError) {
      runtimeError = currentRunError.slice(0, 500);
    }

    if (casePassed) {
      passed += 1;
    }

    details.push({
      stdin: String(testCase.stdin || ""),
      expectedOutput,
      actualOutput: actualOutput || "[empty]",
      status: casePassed ? "Passed" : (currentCompileError || currentRunError || "Wrong answer"),
      passed: casePassed
    });

    if (currentCompileError) {
      break;
    }
  }

  const total = testCases.length;
  while (details.length < total) {
    const testCase = testCases[details.length];
    details.push({
      stdin: String(testCase?.stdin || ""),
      expectedOutput: normalizeOutput(testCase?.expectedOutput || ""),
      actualOutput: "[not executed]",
      status: compileError || runtimeError || "Skipped",
      passed: false
    });
  }

  return {
    passed,
    total,
    accuracyScore: total ? Number(((passed / total) * 100).toFixed(2)) : 0,
    details,
    compileError,
    runtimeError,
    evaluationMode: "piston"
  };
}
