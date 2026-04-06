import { languageMap } from "../utils/languageMap.js";

const languageSignals = {
  c: {
    requiredAll: ["main("],
    requiredAny: ["#include", "printf", "scanf", "puts"],
    inputAny: ["scanf", "fgets", "gets"],
    outputAny: ["printf", "puts"],
    controlFlow: ["for", "while", "if", "switch"]
  },
  cpp: {
    requiredAll: ["main("],
    requiredAny: ["#include", "cout", "cin", "std::"],
    inputAny: ["cin", "getline"],
    outputAny: ["cout", "printf"],
    controlFlow: ["for", "while", "if", "switch"]
  },
  java: {
    requiredAll: ["class", "main("],
    requiredAny: ["public static void main", "system.out"],
    inputAny: ["scanner", "bufferedreader"],
    outputAny: ["system.out.print", "system.out.println"],
    controlFlow: ["for", "while", "if", "switch"]
  },
  javascript: {
    requiredAll: [],
    requiredAny: ["function", "=>", "const", "let", "var"],
    inputAny: ["prompt(", "readline", "fs.readfilesync"],
    outputAny: ["console.log"],
    controlFlow: ["for", "while", "if", "switch"]
  }
};

const tokenRegex = /[A-Za-z_][A-Za-z0-9_]*/g;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalize(text) {
  return String(text || "").toLowerCase();
}

function hasAny(source, tokens = []) {
  const normalized = normalize(source);
  return tokens.some((token) => normalized.includes(token));
}

function countAny(source, tokens = []) {
  const normalized = normalize(source);
  return tokens.filter((token) => normalized.includes(token)).length;
}

function isBalanced(sourceCode) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const opens = new Set(["(", "[", "{"]);
  const stack = [];

  for (const char of sourceCode) {
    if (opens.has(char)) {
      stack.push(char);
      continue;
    }

    if (pairs[char]) {
      if (!stack.length || stack.pop() !== pairs[char]) {
        return false;
      }
    }
  }

  return stack.length === 0;
}

function collectIdentifiers(code, ignored = []) {
  const words = normalize(code).match(tokenRegex) || [];
  const ignoredSet = new Set(ignored);

  return new Set(words.filter((word) => word.length > 2 && !ignoredSet.has(word)));
}

function countMatches(code, hints = []) {
  const normalized = normalize(code);
  return hints.filter((hint) => normalized.includes(hint.toLowerCase())).length;
}

function scoreStructureMatch(sourcePython, translatedCode, language) {
  const normalizedPython = normalize(sourcePython);
  const normalizedCode = normalize(translatedCode);
  const signals = languageSignals[language];

  let score = 0;

  const lengthRatio = clamp(
    normalizedCode.length / Math.max(normalizedPython.length, 1),
    0,
    2
  );
  score += Math.min(20, lengthRatio * 12);

  const sourceHasLoop = normalizedPython.includes("for ") || normalizedPython.includes("while ");
  const sourceHasCondition = normalizedPython.includes("if ") || normalizedPython.includes("elif ");
  const sourceHasFunction = normalizedPython.includes("def ");

  const hasLoop = signals.controlFlow.some((token) => normalizedCode.includes(token));
  const hasCondition = normalizedCode.includes("if");
  const hasFunction = normalizedCode.includes("function") || normalizedCode.includes(" main(") || normalizedCode.includes("main(");

  if (!sourceHasLoop || hasLoop) {
    score += 15;
  }
  if (!sourceHasCondition || hasCondition) {
    score += 15;
  }
  if (!sourceHasFunction || hasFunction) {
    score += 10;
  }

  const identifierOverlap = (() => {
    const pyIdentifiers = collectIdentifiers(sourcePython, ["print", "input", "range", "int", "str", "sum"]);
    const targetIdentifiers = collectIdentifiers(translatedCode, ["console", "system", "printf", "cout", "main", "public", "class", "static"]);

    if (!pyIdentifiers.size) {
      return 0.6;
    }

    let overlap = 0;
    for (const token of pyIdentifiers) {
      if (targetIdentifiers.has(token)) {
        overlap += 1;
      }
    }

    return overlap / pyIdentifiers.size;
  })();

  score += identifierOverlap * 20;

  const inputHint = normalizedPython.includes("input(") ? 1 : 0;
  const outputHint = normalizedPython.includes("print(") ? 1 : 0;
  const outputMatched = countMatches(normalizedCode, signals.output) > 0 ? 1 : 0;
  const entryMatched = countMatches(normalizedCode, signals.entry) > 0 ? 1 : 0;

  if (!inputHint || normalizedCode.includes("scanf") || normalizedCode.includes("cin") || normalizedCode.includes("scanner") || normalizedCode.includes("prompt") || normalizedCode.includes("readline") || normalizedCode.includes("fs.readfilesync")) {
    score += 10;
  }
  if (!outputHint || outputMatched) {
    score += 5;
  }
  if (entryMatched) {
    score += 5;
  }

  return clamp(score, 0, 100);
}

function inferQuestionProfile(sourcePython, title = "") {
  const source = normalize(sourcePython);
  const merged = `${normalize(title)} ${source}`;

  return {
    needsRecursion: source.includes("def ") && source.includes("return") && source.includes("(") && source.includes("- 1"),
    needsLoop: source.includes("for ") || source.includes("while "),
    needsConditional: source.includes("if ") || source.includes("elif "),
    needsSorting: merged.includes("sort") || source.includes("sorted(") || source.includes(".sort("),
    needsSetOrMap: merged.includes("set") || source.includes("set(") || source.includes("dict") || source.includes("{}"),
    needsStringOps: source.includes("strip") || source.includes("lower") || source.includes("[::-1]") || merged.includes("string"),
    needsMathOps: source.includes("sum(") || source.includes("abs(") || source.includes("%") || source.includes("math."),
    needsArrayOps: merged.includes("array") || source.includes("split(") || source.includes("append(") || source.includes("list(")
  };
}

function evaluateLanguageCompliance(translatedCode, language) {
  const signals = languageSignals[language];
  if (!signals) {
    return {
      score: 0,
      compileError: "Unsupported language.",
      warnings: ["Unsupported language selected"]
    };
  }

  const normalized = normalize(translatedCode);
  const warnings = [];
  let score = 100;

  if (!isBalanced(translatedCode)) {
    return {
      score: 0,
      compileError: "Unbalanced brackets detected in submission.",
      warnings: ["Bracket mismatch"]
    };
  }

  for (const token of signals.requiredAll) {
    if (!normalized.includes(token)) {
      score -= 30;
      warnings.push(`Missing required language structure: ${token}`);
    }
  }

  const matchedOptional = countAny(normalized, signals.requiredAny);
  if (signals.requiredAny.length > 0 && matchedOptional === 0) {
    score -= 25;
    warnings.push("Missing expected language-specific syntax tokens");
  }

  const semicolonNeedLanguages = new Set(["c", "cpp", "java"]);
  if (semicolonNeedLanguages.has(language)) {
    const semiCount = (translatedCode.match(/;/g) || []).length;
    if (semiCount < 2) {
      score -= 15;
      warnings.push("Very few semicolons for selected language");
    }
  }

  if (language === "java" && !normalized.includes("public static void main")) {
    score -= 20;
    warnings.push("Java entrypoint should include public static void main");
  }

  if ((language === "c" || language === "cpp") && !normalized.includes("main(")) {
    score -= 20;
    warnings.push("C/C++ solution should include main function");
  }

  if (language === "javascript" && !hasAny(normalized, ["console.log", "return"])) {
    score -= 20;
    warnings.push("JavaScript solution likely missing output/return signal");
  }

  return {
    score: clamp(score, 0, 100),
    compileError: score < 35 ? "Submission does not match basic syntax structure for selected language." : "",
    warnings
  };
}

function evaluateQuestionCompliance({ sourcePython, translatedCode, language, title }) {
  const profile = inferQuestionProfile(sourcePython, title);
  const code = normalize(translatedCode);

  let score = 100;
  const missing = [];

  const recursionSignal = (() => {
    if (language === "javascript") return hasAny(code, ["function", "=>"]) && /\w+\(/.test(code);
    return /\w+\(/.test(code);
  })();

  const checks = [
    {
      active: profile.needsRecursion,
      ok: recursionSignal && (code.includes("return") || code.includes("ans")),
      penalty: 20,
      label: "recursion/function flow"
    },
    {
      active: profile.needsLoop,
      ok: hasAny(code, ["for", "while"]),
      penalty: 15,
      label: "loop logic"
    },
    {
      active: profile.needsConditional,
      ok: hasAny(code, ["if", "else", "switch"]),
      penalty: 15,
      label: "branching logic"
    },
    {
      active: profile.needsSorting,
      ok: hasAny(code, ["sort", "sorted", "arrays.sort", "collections.sort", "qsort", "std::sort"]),
      penalty: 15,
      label: "sorting behavior"
    },
    {
      active: profile.needsSetOrMap,
      ok: hasAny(code, ["set", "map", "hash", "unordered", "dict", "object"]),
      penalty: 10,
      label: "set/map usage"
    },
    {
      active: profile.needsStringOps,
      ok: hasAny(code, ["string", "char", "substring", "slice", "reverse", "tolower", "trim"]),
      penalty: 10,
      label: "string processing"
    },
    {
      active: profile.needsMathOps,
      ok: hasAny(code, ["+", "-", "*", "%", "math", "abs", "sqrt"]),
      penalty: 8,
      label: "math operation"
    },
    {
      active: profile.needsArrayOps,
      ok: hasAny(code, ["[", "]", "array", "vector", "list", "split"]),
      penalty: 8,
      label: "array/list processing"
    }
  ];

  for (const check of checks) {
    if (check.active && !check.ok) {
      score -= check.penalty;
      missing.push(check.label);
    }
  }

  return {
    score: clamp(score, 0, 100),
    profile,
    missing
  };
}

function evaluateInputOutputHandling(translatedCode, language, testCases = [], sourcePython = "") {
  const normalized = normalize(translatedCode);
  const source = normalize(sourcePython);
  const signals = languageSignals[language];

  let score = 100;
  const warnings = [];

  const sourceNeedsInput = source.includes("input(") || testCases.some((testCase) => String(testCase.stdin || "").trim().length > 0);
  const sourceNeedsOutput = source.includes("print(") || testCases.some((testCase) => String(testCase.expectedOutput || "").trim().length > 0);

  if (sourceNeedsInput && !hasAny(normalized, signals.inputAny)) {
    score -= 35;
    warnings.push("Input handling signal missing for selected language");
  }

  if (sourceNeedsOutput && !hasAny(normalized, signals.outputAny)) {
    score -= 35;
    warnings.push("Output handling signal missing for selected language");
  }

  const hasMultilineInputCase = testCases.some((testCase) => String(testCase.stdin || "").includes("\n"));
  if (hasMultilineInputCase && !hasAny(normalized, ["split", "getline", "scanner", "readline", "readfilesync", "fgets"])) {
    score -= 20;
    warnings.push("Likely insufficient parsing for multiline test input");
  }

  return {
    score: clamp(score, 0, 100),
    warnings
  };
}

function estimateCasePass({ code, testCase, baseScore, questionScore, ioScore }) {
  const normalized = normalize(code);
  const expected = normalize(testCase.expectedOutput);
  const stdin = normalize(testCase.stdin);

  const stdinTokens = stdin ? stdin.split(/\s+/).filter(Boolean).length : 0;
  const expectedTokens = expected ? expected.split(/\s+/).filter(Boolean).length : 0;

  let confidence = baseScore * 0.45 + questionScore * 0.35 + ioScore * 0.2;

  if (expected && normalized.includes(expected)) {
    confidence += 12;
  }
  if (stdin && normalized.includes(stdin)) {
    confidence += 8;
  }

  if (stdinTokens >= 3) {
    confidence -= 4;
  }
  if (expectedTokens >= 3) {
    confidence -= 3;
  }
  if (stdin.includes("\n")) {
    confidence -= 5;
  }

  if (hasAny(normalized, ["if", "for", "while", "switch"])) {
    confidence += 3;
  }

  const minThreshold = 56;
  const threshold = minThreshold + (stdinTokens > 4 ? 6 : 0) + (expectedTokens > 4 ? 4 : 0);

  return confidence >= threshold;
}

function detectRuntimeRisk(code) {
  const normalized = normalize(code);

  const riskyWhile = normalized.includes("while(true)") || normalized.includes("while (true)");
  const hasBreak = normalized.includes("break");
  if (riskyWhile && !hasBreak) {
    return "Potential infinite loop pattern detected.";
  }

  return "";
}

function normalizeOutput(text) {
  return String(text || "").replace(/\r\n/g, "\n").trim();
}

function buildJudge0Headers() {
  const headers = { "Content-Type": "application/json" };
  if (process.env.JUDGE0_API_KEY) {
    headers["X-Auth-Token"] = process.env.JUDGE0_API_KEY;
  }
  return headers;
}

async function executeCaseWithJudge0({ sourceCode, language, stdin }) {
  const baseUrl = String(process.env.JUDGE0_BASE_URL || "").replace(/\/+$/, "");
  const languageConfig = languageMap[language];

  if (!baseUrl || !languageConfig) {
    return null;
  }

  const response = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=true`, {
    method: "POST",
    headers: buildJudge0Headers(),
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageConfig.judge0Id,
      stdin: stdin || "",
      cpu_time_limit: 2,
      wall_time_limit: 5,
      memory_limit: 262144
    })
  });

  if (!response.ok) {
    throw new Error(`Judge0 request failed with status ${response.status}`);
  }

  return response.json();
}

export async function evaluateWithJudge0({ sourceCode, language, testCases, sourcePython, questionTitle }) {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    return {
      passed: 0,
      total: 0,
      accuracyScore: 0,
      details: [],
      compileError: "",
      runtimeError: "No test cases configured for this question.",
      evaluationMode: "internal-strict-v2",
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

  const languageCompliance = evaluateLanguageCompliance(sourceCode, language);
  const questionCompliance = evaluateQuestionCompliance({
    sourcePython: sourcePython || "",
    translatedCode: sourceCode,
    language,
    title: questionTitle || ""
  });
  const ioCompliance = evaluateInputOutputHandling(sourceCode, language, testCases, sourcePython || "");
  const structureScore = scoreStructureMatch(sourcePython || "", sourceCode, language);

  const compileError = languageCompliance.compileError;
  const runtimeError = detectRuntimeRisk(sourceCode);
  if (!process.env.JUDGE0_BASE_URL) {
    return {
      passed: 0,
      total: testCases.length,
      accuracyScore: 0,
      details: testCases.map((testCase) => ({
        stdin: testCase.stdin,
        expectedOutput: normalizeOutput(testCase.expectedOutput),
        actualOutput: "[judge0 not configured]",
        status: "Judge0 API not configured",
        passed: false
      })),
      compileError: compileError.slice(0, 500),
      runtimeError: "Judge0 API is required for testcase evaluation but JUDGE0_BASE_URL is not configured.",
      evaluationMode: "judge0-required",
      diagnostics: {
        structureScore: Number(structureScore.toFixed(2)),
        languageScore: Number(languageCompliance.score.toFixed(2)),
        questionScore: Number(questionCompliance.score.toFixed(2)),
        ioScore: Number(ioCompliance.score.toFixed(2)),
        missingQuestionSignals: questionCompliance.missing,
        languageWarnings: languageCompliance.warnings,
        ioWarnings: ioCompliance.warnings
      }
    };
  }

  if (!compileError && !runtimeError) {
    try {
      const details = [];
      let passed = 0;
      let firstCompileError = "";
      let firstRuntimeError = "";

      for (const testCase of testCases) {
        const execution = await executeCaseWithJudge0({
          sourceCode,
          language,
          stdin: testCase.stdin
        });

        const actualOutput = normalizeOutput(execution.stdout);
        const expectedOutput = normalizeOutput(testCase.expectedOutput);
        const statusId = Number(execution.status?.id || 0);
        const statusDescription = execution.status?.description || "Unknown";
        const isAccepted = statusId === 3;
        const casePassed = isAccepted && actualOutput === expectedOutput;

        if (casePassed) {
          passed += 1;
        }

        if (!firstCompileError && execution.compile_output) {
          firstCompileError = String(execution.compile_output).slice(0, 500);
        }
        if (!firstRuntimeError && execution.stderr) {
          firstRuntimeError = String(execution.stderr).slice(0, 500);
        }
        if (!firstRuntimeError && execution.message) {
          firstRuntimeError = String(execution.message).slice(0, 500);
        }

        details.push({
          stdin: testCase.stdin,
          expectedOutput,
          actualOutput: actualOutput || "[empty]",
          status: casePassed ? "Passed" : statusDescription,
          passed: casePassed
        });
      }

      const total = testCases.length;
      return {
        passed,
        total,
        accuracyScore: Number(((passed / total) * 100).toFixed(2)),
        details,
        compileError: firstCompileError,
        runtimeError: firstRuntimeError,
        evaluationMode: "judge0-live",
        diagnostics: {
          structureScore: Number(structureScore.toFixed(2)),
          languageScore: Number(languageCompliance.score.toFixed(2)),
          questionScore: Number(questionCompliance.score.toFixed(2)),
          ioScore: Number(ioCompliance.score.toFixed(2)),
          missingQuestionSignals: questionCompliance.missing,
          languageWarnings: languageCompliance.warnings,
          ioWarnings: ioCompliance.warnings
        }
      };
    } catch (error) {
      return {
        passed: 0,
        total: testCases.length,
        accuracyScore: 0,
        details: testCases.map((testCase) => ({
          stdin: testCase.stdin,
          expectedOutput: normalizeOutput(testCase.expectedOutput),
          actualOutput: "[judge0 execution failed]",
          status: "Judge0 execution failed",
          passed: false
        })),
        compileError: "",
        runtimeError: String(error.message || "Judge0 execution failed").slice(0, 500),
        evaluationMode: "judge0-required",
        diagnostics: {
          structureScore: Number(structureScore.toFixed(2)),
          languageScore: Number(languageCompliance.score.toFixed(2)),
          questionScore: Number(questionCompliance.score.toFixed(2)),
          ioScore: Number(ioCompliance.score.toFixed(2)),
          missingQuestionSignals: questionCompliance.missing,
          languageWarnings: languageCompliance.warnings,
          ioWarnings: ioCompliance.warnings
        }
      };
    }
  }

  return {
    passed: 0,
    total: testCases.length,
    accuracyScore: 0,
    details: testCases.map((testCase) => ({
      stdin: testCase.stdin,
      expectedOutput: normalizeOutput(testCase.expectedOutput),
      actualOutput: "[execution blocked]",
      status: compileError || runtimeError || "Judge0 execution unavailable",
      passed: false
    })),
    compileError: compileError.slice(0, 500),
    runtimeError: runtimeError.slice(0, 500) || "Execution was not completed through Judge0.",
    evaluationMode: "judge0-required",
    diagnostics: {
      structureScore: Number(structureScore.toFixed(2)),
      languageScore: Number(languageCompliance.score.toFixed(2)),
      questionScore: Number(questionCompliance.score.toFixed(2)),
      ioScore: Number(ioCompliance.score.toFixed(2)),
      missingQuestionSignals: questionCompliance.missing,
      languageWarnings: languageCompliance.warnings,
      ioWarnings: ioCompliance.warnings
    }
  };
}
