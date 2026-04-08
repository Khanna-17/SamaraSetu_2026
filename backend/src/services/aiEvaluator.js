import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { spawn } from "child_process";
import { evaluateWithJudge0, runCodeWithJudge0 } from "./judge0.js";

const SUPPORTED_LANGUAGES = new Set(["c", "cpp", "java", "javascript", "go", "rust", "kotlin"]);
const JUDGE0_PREFERRED_LANGUAGES = new Set(["go", "rust", "kotlin"]);

const DEFAULT_COMPILE_TIMEOUT_MS = Number(process.env.LOCAL_COMPILE_TIMEOUT_MS || 30000);
const DEFAULT_RUN_TIMEOUT_MS = Number(process.env.LOCAL_RUN_TIMEOUT_MS || 10000);
const OUTPUT_LIMIT_BYTES = Number(process.env.LOCAL_OUTPUT_LIMIT_BYTES || 120000);

function shouldUseJudge0(language) {
  const forceLocal = String(process.env.FORCE_LOCAL_EXECUTION || "false").toLowerCase() === "true";
  if (forceLocal) {
    return false;
  }

  return Boolean(process.env.JUDGE0_BASE_URL) && JUDGE0_PREFERRED_LANGUAGES.has(String(language || "").toLowerCase());
}

function sanitizeJudge0Diagnostics(language, diagnostics) {
  const lines = String(diagnostics || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (String(language || "").toLowerCase() === "kotlin") {
    return lines
      .filter((line) => !line.includes("Options -Xverify:none and -noverify were deprecated"))
      .join("\n")
      .trim();
  }

  return lines.join("\n").trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function normalize(text) {
  return String(text || "").toLowerCase();
}

function normalizeOutput(text) {
  return String(text || "").replace(/\r\n/g, "\n").trim();
}

function collectTokens(source) {
  const tokenRegex = /[A-Za-z_][A-Za-z0-9_]*/g;
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
  const hasReturnCall = normalized.split("\n").some((line) => /\breturn\b/.test(line) && /\w+\(/.test(line));

  if (loops >= 2) {
    return 3;
  }
  if (loops === 1 || hasReturnCall) {
    return 2;
  }
  return 1;
}

function hasDataStructureSignals(code) {
  const normalized = normalize(code);
  return ["[", "{", "array", "vector", "list", "map", "set"].some((token) => normalized.includes(token));
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

<<<<<<< HEAD
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

=======
>>>>>>> 4739f907ade21d8f90ea020908f1051058eaa2e4
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

async function runProcess({ command, args, cwd, stdin = "", timeoutMs }) {
  const effectiveTimeout = Number(timeoutMs) > 0 ? Number(timeoutMs) : 0;

<<<<<<< HEAD
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
=======
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      windowsHide: true
>>>>>>> 4739f907ade21d8f90ea020908f1051058eaa2e4
    });

    let stdout = "";
    let stderr = "";
    let killedByTimeout = false;
    let outputOverflow = false;

    const appendBounded = (existing, chunk) => {
      const next = existing + chunk;
      if (Buffer.byteLength(next, "utf8") <= OUTPUT_LIMIT_BYTES) {
        return next;
      }
      outputOverflow = true;
      return next.slice(0, OUTPUT_LIMIT_BYTES);
    };

    const timer = effectiveTimeout
      ? setTimeout(() => {
          killedByTimeout = true;
          child.kill("SIGKILL");
        }, effectiveTimeout)
      : null;

    child.stdout.on("data", (chunk) => {
      stdout = appendBounded(stdout, String(chunk));
    });

    child.stderr.on("data", (chunk) => {
      stderr = appendBounded(stderr, String(chunk));
    });

    child.on("error", (error) => {
      if (timer) clearTimeout(timer);
      resolve({ ok: false, exitCode: -1, stdout, stderr: `${stderr}\n${String(error.message || error)}`.trim(), timedOut: false, outputOverflow });
    });

    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      resolve({
        ok: code === 0 && !killedByTimeout,
        exitCode: Number(code ?? -1),
        stdout,
        stderr,
        timedOut: killedByTimeout,
        outputOverflow
      });
    });

    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  });
}

function parseJavaClassName(userCode) {
  const publicMatch = String(userCode || "").match(/public\s+class\s+([A-Za-z_][A-Za-z0-9_]*)/);
  if (publicMatch?.[1]) {
    return publicMatch[1];
  }
  const classMatch = String(userCode || "").match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
  return classMatch?.[1] || null;
}

function resolveLanguageConfig(language, userCode) {
  if (!SUPPORTED_LANGUAGES.has(language)) {
    return null;
  }

  if (language === "c") {
    return {
      sourceFile: "main.c",
      compile: { command: "gcc", args: ["main.c", "-O2", "-std=c17", "-o", "main"] },
      run: { command: process.platform === "win32" ? "main.exe" : "./main", args: [] }
    };
  }

  if (language === "cpp") {
    return {
      sourceFile: "main.cpp",
      compile: { command: "g++", args: ["main.cpp", "-O2", "-std=c++17", "-o", "main"] },
      run: { command: process.platform === "win32" ? "main.exe" : "./main", args: [] }
    };
  }

  if (language === "go") {
    return {
      sourceFile: "main.go",
      compile: { command: "go", args: ["build", "-o", "main", "main.go"] },
      run: { command: process.platform === "win32" ? "main.exe" : "./main", args: [] }
    };
  }

<<<<<<< HEAD
  try {
    const payload = await callProviderJson({
      apiKey,
      model,
      prompt: `You are a strict testcase evaluator. Return only valid JSON.\n\n${prompt}`,
      timeoutMs: 45000
    });
=======
  if (language === "rust") {
    return {
      sourceFile: "main.rs",
      compile: { command: "rustc", args: ["main.rs", "-O", "-o", "main"] },
      run: { command: process.platform === "win32" ? "main.exe" : "./main", args: [] }
    };
  }
>>>>>>> 4739f907ade21d8f90ea020908f1051058eaa2e4

  if (language === "java") {
    const className = parseJavaClassName(userCode);
    if (!className) {
      return {
        sourceFile: "Main.java",
        compile: null,
        run: null,
        setupError: "Java code must declare a class, e.g. 'public class Main'."
      };
    }

    return {
      sourceFile: `${className}.java`,
      compile: { command: "javac", args: [`${className}.java`] },
      run: { command: "java", args: [className] }
    };
  }

  if (language === "kotlin") {
    return {
      sourceFile: "Main.kt",
      compile: { command: "kotlinc", args: ["Main.kt", "-include-runtime", "-d", "main.jar"] },
      run: { command: "java", args: ["-jar", "main.jar"] }
    };
  }

  return {
    sourceFile: "main.js",
    compile: null,
    run: { command: "node", args: ["main.js"] }
  };
}

async function withWorkspace(language, userCode, worker) {
  const config = resolveLanguageConfig(language, userCode);
  if (!config) {
    return {
      ok: false,
      compileError: `Unsupported language: ${language}`,
      runtimeError: "",
      output: ""
    };
  }
  if (config.setupError) {
    return {
      ok: false,
      compileError: config.setupError,
      runtimeError: "",
      output: ""
    };
  }

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "arena-local-"));

  try {
    await fs.writeFile(path.join(workDir, config.sourceFile), String(userCode || ""), "utf8");

    if (config.compile) {
      const compileResult = await runProcess({
        command: config.compile.command,
        args: config.compile.args,
        cwd: workDir,
        timeoutMs: DEFAULT_COMPILE_TIMEOUT_MS
      });

      if (!compileResult.ok) {
        const reason = compileResult.timedOut
          ? `Compilation timed out after ${DEFAULT_COMPILE_TIMEOUT_MS} ms.`
          : compileResult.stderr || compileResult.stdout || "Compilation failed.";
        return {
          ok: false,
          compileError: String(reason).slice(0, 4000),
          runtimeError: "",
          output: ""
        };
      }
    }

    return await worker({ workDir, config });
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

async function runCompiledCode({ language, userCode, stdin = "" }) {
  return withWorkspace(language, userCode, async ({ workDir, config }) => {
    const runResult = await runProcess({
      command: config.run.command,
      args: config.run.args,
      cwd: workDir,
      stdin,
      timeoutMs: DEFAULT_RUN_TIMEOUT_MS
    });

    if (!runResult.ok) {
      const reason = runResult.timedOut
        ? `Execution timed out after ${DEFAULT_RUN_TIMEOUT_MS} ms.`
        : runResult.stderr || runResult.stdout || "Execution failed.";
      return {
        ok: false,
        compileError: "",
        runtimeError: String(reason).slice(0, 4000),
        output: ""
      };
    }

    let notes = "Run completed.";
    if (runResult.outputOverflow) {
      notes = "Run completed with output truncated due to size limit.";
    }

    return {
      ok: true,
      compileError: "",
      runtimeError: "",
      output: runResult.stdout,
      notes
    };
  });
}

export async function evaluateWithAi({ sourcePython, userCode, targetLanguage }) {
  const localScore = localEvaluate(sourcePython, userCode, targetLanguage);
  return {
    ...localScore,
    feedback: `${buildFeedback(localScore)} Deterministic local scoring is active (no external API).`
  };
}

export async function compileWithAi({ userCode, targetLanguage }) {
  if (!String(userCode || "").trim()) {
    return { ok: false, messages: ["Code is empty."] };
  }

  if (shouldUseJudge0(targetLanguage)) {
    try {
      const preview = await runCodeWithJudge0({
        sourceCode: userCode,
        language: targetLanguage,
        stdin: ""
      });

      const compileOutput = String(preview.compileOutput || "").trim();
      const status = String(preview.statusDescription || "").toLowerCase();
      const likelyCompileError =
        Boolean(compileOutput) || status.includes("compile") || status.includes("compilation");

      if (likelyCompileError) {
        return {
          ok: false,
          messages: [compileOutput || preview.statusDescription || "Compilation failed."]
        };
      }

      return {
        ok: true,
        messages: ["Judge0 compile check succeeded."]
      };
    } catch (error) {
      // Fall through to local compile path when Judge0 is temporarily unavailable.
    }
  }

  const compileOnly = await withWorkspace(targetLanguage, userCode, async () => ({
    ok: true,
    compileError: "",
    runtimeError: "",
    output: ""
  }));

  if (!compileOnly.ok) {
    return {
      ok: false,
      messages: [compileOnly.compileError || "Compilation failed."]
    };
  }

  return {
    ok: true,
    messages: ["Native compile succeeded."]
  };
}

<<<<<<< HEAD
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

=======
export async function runCodeWithAi({ userCode, targetLanguage, stdin = "" }) {
>>>>>>> 4739f907ade21d8f90ea020908f1051058eaa2e4
  if (!String(userCode || "").trim()) {
    return {
      output: "",
      notes: "Code is empty."
    };
  }

  if (shouldUseJudge0(targetLanguage)) {
    try {
      const execution = await runCodeWithJudge0({
        sourceCode: userCode,
        language: targetLanguage,
        stdin
      });

      const output = String(execution.stdout || "");
      const diagnostics = [execution.compileOutput, execution.stderr, execution.message]
        .filter((value) => String(value || "").trim().length > 0)
        .join("\n")
        .trim();
      const cleanDiagnostics = sanitizeJudge0Diagnostics(targetLanguage, diagnostics);

      return {
        output,
        notes: cleanDiagnostics || `Run completed via Judge0 (${execution.statusDescription || "ok"}).`
      };
    } catch (error) {
      // Fall through to local run path when Judge0 is temporarily unavailable.
    }
  }

  const execution = await runCompiledCode({ language: targetLanguage, userCode, stdin });
  if (!execution.ok) {
    return {
      output: "",
      notes: execution.compileError || execution.runtimeError || "Run failed."
    };
  }

  return {
    output: String(execution.output || ""),
    notes: String(execution.notes || "Run completed.")
  };
}

export async function evaluateTestCasesWithAi({ userCode, targetLanguage, testCases, sourcePython = "", questionTitle = "" }) {
  const cases = Array.isArray(testCases) ? testCases : [];

<<<<<<< HEAD
  try {
    const payload = await callProviderJson({
      apiKey,
      model,
      prompt: `You are a strict code execution simulator. Return only valid JSON.\n\n${prompt}`,
      timeoutMs: 45000
=======
  if (!String(userCode || "").trim()) {
    return {
      passed: 0,
      total: cases.length,
      accuracyScore: 0,
      details: cases.map((testCase) => ({
        stdin: String(testCase?.stdin || ""),
        expectedOutput: normalizeOutput(testCase?.expectedOutput || ""),
        actualOutput: "",
        status: "Code is empty",
        passed: false
      })),
      compileError: "Code is empty.",
      runtimeError: "",
      evaluationMode: "local-native-runner",
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

  if (shouldUseJudge0(targetLanguage)) {
    try {
      return await evaluateWithJudge0({
        sourceCode: userCode,
        language: targetLanguage,
        testCases: cases,
        sourcePython,
        questionTitle
      });
    } catch (error) {
      // Fall through to local testcase runner when Judge0 is temporarily unavailable.
    }
  }

  const details = [];
  let compileError = "";
  let runtimeError = "";

  for (const testCase of cases) {
    const stdin = String(testCase?.stdin || "");
    const expected = normalizeOutput(testCase?.expectedOutput || "");
    const execution = await runCompiledCode({
      language: targetLanguage,
      userCode,
      stdin
>>>>>>> 4739f907ade21d8f90ea020908f1051058eaa2e4
    });

    if (!execution.ok) {
      compileError = compileError || execution.compileError;
      runtimeError = runtimeError || execution.runtimeError;
      details.push({
        stdin,
        expectedOutput: expected,
        actualOutput: "",
        status: execution.compileError ? "Compile Error" : "Runtime Error",
        passed: false
      });
      continue;
    }

    const actual = normalizeOutput(execution.output || "");
    const passed = actual === expected;

    details.push({
      stdin,
      expectedOutput: expected,
      actualOutput: actual,
      status: passed ? "Passed" : "Wrong Answer",
      passed
    });
  }

  const total = details.length;
  const passed = details.filter((item) => item.passed).length;
  const accuracyScore = total ? Number(((passed / total) * 100).toFixed(2)) : 0;

  return {
    passed,
    total,
    accuracyScore,
    details,
    compileError,
    runtimeError,
    evaluationMode: "local-native-runner",
    diagnostics: {
      structureScore: 100,
      languageScore: SUPPORTED_LANGUAGES.has(targetLanguage) ? 100 : 0,
      questionScore: 100,
      ioScore: 100,
      missingQuestionSignals: [],
      languageWarnings: [],
      ioWarnings: []
    }
  };
}