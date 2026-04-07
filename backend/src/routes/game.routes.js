import { Router } from "express";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import { requireUser } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { evaluateWithAi } from "../services/aiEvaluator.js";
import { evaluateWithJudge0, runCodeWithJudge0 } from "../services/judge0.js";
import { computeAiTotal, computeFinalScore, computeTimeScore } from "../services/scoring.js";
import { getIo } from "../config/socket.js";
import { pickFairQuestion } from "../services/questionSelector.js";
import {
  createSession,
  getAttemptHistoryByRollNumber,
  getAttemptSummaryByRollNumber,
  getAttemptedQuestionIdsByRollNumber,
  getContestState,
  getQuestionById,
  getSessionById,
  updateSession
} from "../store/memoryStore.js";

const router = Router();

const allowedLanguages = ["go", "rust", "kotlin"];

function sanitizeCode(rawCode) {
  const maxLength = Number(process.env.MAX_CODE_LENGTH || 15000);
  const code = String(rawCode || "").slice(0, maxLength);
  return code.replace(/\u0000/g, "");
}

function basicCompileCheck(code, language) {
  const src = String(code || "");
  const normalized = src.toLowerCase();
  const result = { ok: true, messages: [] };

  if (!src.trim()) {
    return { ok: false, messages: ["Code is empty."] };
  }

  const bracesOk = (() => {
    const stack = [];
    const pairs = { ")": "(", "]": "[", "}": "{" };
    for (const ch of src) {
      if (ch === "(" || ch === "[" || ch === "{") stack.push(ch);
      if (pairs[ch]) {
        if (!stack.length || stack.pop() !== pairs[ch]) {
          return false;
        }
      }
    }
    return stack.length === 0;
  })();

  if (!bracesOk) {
    result.ok = false;
    result.messages.push("Bracket mismatch detected.");
  }

  if (language === "go" && !normalized.includes("func main")) {
    result.ok = false;
    result.messages.push("Go program should include 'func main'.");
  }
  if (language === "rust" && !normalized.includes("fn main")) {
    result.ok = false;
    result.messages.push("Rust program should include 'fn main'.");
  }
  if (language === "kotlin" && !normalized.includes("fun main")) {
    result.ok = false;
    result.messages.push("Kotlin program should include 'fun main'.");
  }
  if (result.ok) {
    result.messages.push("Basic compile checks passed.");
  }

  return result;
}

function isCompilationFailure(execution) {
  const statusId = Number(execution?.statusId || 0);
  const statusText = String(execution?.statusDescription || "").toLowerCase();
  return statusId === 6 || statusText.includes("compilation error");
}

router.get("/session", requireUser, async (req, res) => {
  const session = getSessionById(req.user.sessionId);

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  const assignedQuestion = getQuestionById(session.assignedQuestion);
  const attemptSummary = getAttemptSummaryByRollNumber(session.rollNumber);
  const attemptHistory = getAttemptHistoryByRollNumber(session.rollNumber);
  const contestState = getContestState();

  return res.json({
    session: {
      id: session._id,
      name: session.name,
      rollNumber: session.rollNumber,
      slotId: session.slotId,
      slotName: session.slotName,
      selectedLanguage: session.selectedLanguage,
      code: session.code,
      startedAt: session.startedAt,
      timeTaken: session.timeTaken,
      tabSwitchCount: session.tabSwitchCount || 0,
      fullscreenExitCount: session.fullscreenExitCount || 0,
      copyAttemptCount: session.copyAttemptCount || 0,
      pasteAttemptCount: session.pasteAttemptCount || 0,
      status: session.status,
      attemptSummary,
      attemptHistory,
      contestState,
      question: {
        id: assignedQuestion._id,
        title: assignedQuestion.title,
        hint: assignedQuestion.hint,
        category: assignedQuestion.category,
        pythonCode: assignedQuestion.pythonCode,
        difficulty: assignedQuestion.difficulty,
        expectedTimeSeconds: assignedQuestion.expectedTimeSeconds,
        sampleTestCases: (assignedQuestion.testCases || []).slice(0, 5).map((testCase, index) => ({
          index: index + 1,
          stdin: testCase.stdin || "",
          expectedOutput: testCase.expectedOutput || ""
        }))
      },
      scoreBreakdown: session.scoreBreakdown,
      testReport: session.testReport,
      aiEvaluation: session.aiEvaluation,
      submittedAt: session.submittedAt
    }
  });
});

router.post(
  "/autosave",
  requireUser,
  [
    body("selectedLanguage").optional().isIn(allowedLanguages),
    body("code").optional().isString(),
    body("timeTaken").optional().isFloat({ min: 0, max: 7200 })
  ],
  validateRequest,
  async (req, res) => {
    const session = getSessionById(req.user.sessionId);
    if (!session || session.status !== "in-progress") {
      return res.status(404).json({ message: "Session not found" });
    }

    const payload = {};

    if (typeof req.body.code === "string") {
      payload.code = sanitizeCode(req.body.code);
    }

    if (
      allowedLanguages.includes(req.body.selectedLanguage) &&
      req.body.selectedLanguage === session.selectedLanguage
    ) {
      payload.selectedLanguage = req.body.selectedLanguage;
    }

    if (typeof req.body.timeTaken === "number") {
      payload.timeTaken = req.body.timeTaken;
    }

    updateSession(req.user.sessionId, payload);

    res.json({ ok: true });
  }
);

router.post(
  "/compile",
  requireUser,
  [
    body("selectedLanguage").isIn(allowedLanguages),
    body("code").isString().isLength({ min: 1, max: Number(process.env.MAX_CODE_LENGTH || 15000) })
  ],
  validateRequest,
  async (req, res) => {
    const session = getSessionById(req.user.sessionId);
    if (!session || session.status !== "in-progress") {
      return res.status(404).json({ message: "Session not found" });
    }

    const selectedLanguage = req.body.selectedLanguage;
    if (selectedLanguage !== session.selectedLanguage) {
      return res.status(400).json({
        message: `Language is locked for your slot. Use ${session.selectedLanguage}.`
      });
    }

    const code = sanitizeCode(req.body.code);
    const compile = basicCompileCheck(code, selectedLanguage);

    if (!compile.ok) {
      return res.json({ ok: false, messages: compile.messages });
    }

    if (!process.env.JUDGE0_BASE_URL) {
      return res.json({
        ok: false,
        messages: ["Judge0 is not configured. Set JUDGE0_BASE_URL to enable compile checks."]
      });
    }

    try {
      const execution = await runCodeWithJudge0({
        sourceCode: code,
        language: selectedLanguage,
        stdin: ""
      });

      if (isCompilationFailure(execution)) {
        return res.json({
          ok: false,
          messages: [
            "Compilation failed.",
            String(execution.compileOutput || execution.stderr || execution.message || execution.statusDescription || "Unknown compile error")
          ]
        });
      }

      const messages = ["Compilation successful on Judge0."];
      if (execution.compileOutput) {
        messages.push(`Compiler note: ${execution.compileOutput}`);
      }
      if (execution.stderr) {
        messages.push(`Runtime warning: ${execution.stderr}`);
      }

      return res.json({ ok: true, messages });
    } catch (error) {
      return res.json({
        ok: false,
        messages: [String(error.message || "Compile check failed")]
      });
    }
  }
);

router.post(
  "/run",
  requireUser,
  [
    body("selectedLanguage").isIn(allowedLanguages),
    body("code").isString().isLength({ min: 1, max: Number(process.env.MAX_CODE_LENGTH || 15000) }),
    body("stdin").optional().isString().isLength({ max: 5000 })
  ],
  validateRequest,
  async (req, res) => {
    const session = getSessionById(req.user.sessionId);
    if (!session || session.status !== "in-progress") {
      return res.status(404).json({ message: "Session not found" });
    }

    const selectedLanguage = req.body.selectedLanguage;
    if (selectedLanguage !== session.selectedLanguage) {
      return res.status(400).json({
        message: `Language is locked for your slot. Use ${session.selectedLanguage}.`
      });
    }

    const code = sanitizeCode(req.body.code);
    const stdin = String(req.body.stdin || "");

    const compile = basicCompileCheck(code, selectedLanguage);
    if (!compile.ok) {
      return res.json({
        output: "",
        notes: `Compile checks failed: ${compile.messages.join(" ")}`,
        message: `Compile checks failed: ${compile.messages.join(" ")}`
      });
    }

    if (!process.env.JUDGE0_BASE_URL) {
      return res.json({
        output: "",
        notes: "Run preview is unavailable because Judge0 is not configured.",
        message: "Run preview is unavailable because Judge0 is not configured."
      });
    }

    try {
      const execution = await runCodeWithJudge0({
        sourceCode: code,
        language: selectedLanguage,
        stdin
      });

      if (isCompilationFailure(execution)) {
        return res.json({
          output: "",
          notes: String(execution.compileOutput || execution.stderr || execution.message || execution.statusDescription || "Compilation failed."),
          message: String(execution.compileOutput || execution.stderr || execution.message || execution.statusDescription || "Compilation failed.")
        });
      }

      const warningText = [execution.compileOutput, execution.stderr, execution.message]
        .map((x) => String(x || "").trim())
        .filter(Boolean)
        .join("\n");

      if (warningText) {
        return res.json({
          output: String(execution.stdout || "").trim(),
          notes: warningText,
          message: warningText
        });
      }

      return res.json({
        output: String(execution.stdout || "").trim(),
        notes: String(execution.statusDescription || "Run completed.")
      });
    } catch {
      return res.json({
        output: "",
        notes: "Run preview failed due to execution service error.",
        message: "Run preview failed due to execution service error."
      });
    }
  }
);

router.post(
  "/submit",
  requireUser,
  [
    body("selectedLanguage").isIn(allowedLanguages),
    body("code").isString().isLength({ min: 1, max: Number(process.env.MAX_CODE_LENGTH || 15000) }),
    body("timeTaken").isFloat({ min: 0, max: 7200 })
  ],
  validateRequest,
  async (req, res) => {
    const contestState = getContestState();
    if (contestState.mode !== "live") {
      return res.status(423).json({
        message: contestState.message || "Contest is not live. Submission is disabled.",
        contestState
      });
    }

    const session = getSessionById(req.user.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status === "submitted") {
      return res.status(409).json({ message: "Already submitted" });
    }

    const code = sanitizeCode(req.body.code);
    const selectedLanguage = req.body.selectedLanguage;
    const timeTaken = req.body.timeTaken;
    const assignedQuestion = getQuestionById(session.assignedQuestion);

    if (!code.trim()) {
      return res.status(400).json({ message: "Code cannot be empty." });
    }

    if (selectedLanguage !== session.selectedLanguage) {
      return res.status(400).json({
        message: `Language is locked for your slot. Use ${session.selectedLanguage}.`
      });
    }

    if (!process.env.JUDGE0_BASE_URL) {
      return res.status(503).json({
        message: "Submission is unavailable because Judge0 is not configured on the server."
      });
    }

    try {
      const judgeResult = await evaluateWithJudge0({
        sourceCode: code,
        language: selectedLanguage,
        testCases: assignedQuestion.testCases,
        sourcePython: assignedQuestion.pythonCode,
        questionTitle: assignedQuestion.title
      });

      if (judgeResult.evaluationMode === "judge0-required") {
        return res.status(503).json({
          message: judgeResult.runtimeError || "Submission failed because Judge0 evaluation is unavailable."
        });
      }

      const aiEvaluation = await evaluateWithAi({
        sourcePython: assignedQuestion.pythonCode,
        userCode: code,
        targetLanguage: selectedLanguage
      });

      const aiScore = computeAiTotal(aiEvaluation);
      const timeScore = computeTimeScore(timeTaken, assignedQuestion.expectedTimeSeconds);
      const finalScore = computeFinalScore({
        accuracyScore: judgeResult.accuracyScore
      });

      const updatedSession = updateSession(req.user.sessionId, {
        code,
        selectedLanguage,
        status: "submitted",
        submittedAt: new Date().toISOString(),
        timeTaken,
        aiEvaluation,
        scoreBreakdown: {
          accuracyScore: judgeResult.accuracyScore,
          aiScore,
          timeScore,
          finalScore
        },
        testReport: {
          passed: judgeResult.passed,
          total: judgeResult.total,
          failedCases: judgeResult.details.filter((x) => !x.passed),
          compileError: judgeResult.compileError,
          runtimeError: judgeResult.runtimeError,
          evaluationMode: judgeResult.evaluationMode || "internal-heuristic",
          diagnostics: judgeResult.diagnostics || {}
        }
      });

      const io = getIo();
      if (io) {
        io.to("admin-room").emit("participant-updated", {
          id: updatedSession._id,
          name: updatedSession.name,
          rollNumber: updatedSession.rollNumber,
          selectedLanguage,
          finalScore,
          status: updatedSession.status,
          timeTaken,
          tabSwitchCount: updatedSession.tabSwitchCount || 0,
          fullscreenExitCount: updatedSession.fullscreenExitCount || 0,
          copyAttemptCount: updatedSession.copyAttemptCount || 0,
          pasteAttemptCount: updatedSession.pasteAttemptCount || 0
        });
        io.to("leaderboard-room").emit("leaderboard-refresh");
      }

      return res.json({
        scoreBreakdown: updatedSession.scoreBreakdown,
        testReport: updatedSession.testReport,
        aiEvaluation: updatedSession.aiEvaluation,
        attemptSummary: getAttemptSummaryByRollNumber(updatedSession.rollNumber),
        attemptHistory: getAttemptHistoryByRollNumber(updatedSession.rollNumber),
        contestState: getContestState(),
        judgeDiagnostics: judgeResult.diagnostics || {}
      });
    } catch (error) {
      return res.status(500).json({
        message: String(error.message || "Submission evaluation failed.").slice(0, 500)
      });
    }
  }
);

router.post("/tab-switch", requireUser, async (req, res) => {
  const session = getSessionById(req.user.sessionId);
  if (!session || session.status !== "in-progress") {
    return res.status(404).json({ message: "Session not found" });
  }

  const updatedSession = updateSession(req.user.sessionId, {
    tabSwitchCount: Number(session.tabSwitchCount || 0) + 1
  });

  const io = getIo();
  if (io) {
    io.to("admin-room").emit("participant-updated", {
      id: updatedSession._id,
      name: updatedSession.name,
      rollNumber: updatedSession.rollNumber,
      selectedLanguage: updatedSession.selectedLanguage,
      slotId: updatedSession.slotId,
      finalScore: updatedSession.scoreBreakdown?.finalScore || 0,
      status: updatedSession.status,
      timeTaken: updatedSession.timeTaken,
      tabSwitchCount: updatedSession.tabSwitchCount || 0,
      fullscreenExitCount: updatedSession.fullscreenExitCount || 0
    });
  }

  return res.json({ ok: true, tabSwitchCount: updatedSession.tabSwitchCount || 0 });
});

router.post("/fullscreen-exit", requireUser, async (req, res) => {
  const session = getSessionById(req.user.sessionId);
  if (!session || session.status !== "in-progress") {
    return res.status(404).json({ message: "Session not found" });
  }

  const updatedSession = updateSession(req.user.sessionId, {
    fullscreenExitCount: Number(session.fullscreenExitCount || 0) + 1
  });

  const io = getIo();
  if (io) {
    io.to("admin-room").emit("participant-updated", {
      id: updatedSession._id,
      name: updatedSession.name,
      rollNumber: updatedSession.rollNumber,
      selectedLanguage: updatedSession.selectedLanguage,
      slotId: updatedSession.slotId,
      finalScore: updatedSession.scoreBreakdown?.finalScore || 0,
      status: updatedSession.status,
      timeTaken: updatedSession.timeTaken,
      tabSwitchCount: updatedSession.tabSwitchCount || 0,
      fullscreenExitCount: updatedSession.fullscreenExitCount || 0,
      copyAttemptCount: updatedSession.copyAttemptCount || 0,
      pasteAttemptCount: updatedSession.pasteAttemptCount || 0
    });
  }

  return res.json({ ok: true, fullscreenExitCount: updatedSession.fullscreenExitCount || 0 });
});

router.post(
  "/clipboard-attempt",
  requireUser,
  [body("type").isIn(["copy", "paste"])],
  validateRequest,
  async (req, res) => {
    const session = getSessionById(req.user.sessionId);
    if (!session || session.status !== "in-progress") {
      return res.status(404).json({ message: "Session not found" });
    }

    const updates =
      req.body.type === "copy"
        ? { copyAttemptCount: Number(session.copyAttemptCount || 0) + 1 }
        : { pasteAttemptCount: Number(session.pasteAttemptCount || 0) + 1 };

    const updatedSession = updateSession(req.user.sessionId, updates);

    const io = getIo();
    if (io) {
      io.to("admin-room").emit("participant-updated", {
        id: updatedSession._id,
        name: updatedSession.name,
        rollNumber: updatedSession.rollNumber,
        selectedLanguage: updatedSession.selectedLanguage,
        slotId: updatedSession.slotId,
        finalScore: updatedSession.scoreBreakdown?.finalScore || 0,
        status: updatedSession.status,
        timeTaken: updatedSession.timeTaken,
        tabSwitchCount: updatedSession.tabSwitchCount || 0,
        fullscreenExitCount: updatedSession.fullscreenExitCount || 0,
        copyAttemptCount: updatedSession.copyAttemptCount || 0,
        pasteAttemptCount: updatedSession.pasteAttemptCount || 0
      });
    }

    return res.json({
      ok: true,
      copyAttemptCount: updatedSession.copyAttemptCount || 0,
      pasteAttemptCount: updatedSession.pasteAttemptCount || 0
    });
  }
);

router.post("/next-question", requireUser, async (req, res) => {
  const contestState = getContestState();
  if (contestState.mode !== "live") {
    return res.status(423).json({
      message: contestState.message || "Contest is not live. New questions are locked.",
      contestState
    });
  }

  const session = getSessionById(req.user.sessionId);

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (session.status !== "submitted") {
    return res.status(409).json({ message: "Submit the current question before starting the next one." });
  }

  const attemptedQuestionIds = getAttemptedQuestionIdsByRollNumber(session.rollNumber);
  const attemptSummary = getAttemptSummaryByRollNumber(session.rollNumber);
  if (!attemptSummary.canAttemptMore) {
    return res.status(409).json({ message: "No more questions are available for this user." });
  }

  const question = await pickFairQuestion({ excludeQuestionIds: attemptedQuestionIds, rollNumber: session.rollNumber });
  const nextSession = createSession({
    name: session.name,
    rollNumber: session.rollNumber,
    resumeKey: session.resumeKey,
    assignedQuestionId: question._id,
    code: "",
    selectedLanguage: session.selectedLanguage,
    slotId: session.slotId,
    slotName: session.slotName
  });

  const nextToken = jwt.sign(
    { sessionId: nextSession._id.toString(), role: "user", rollNumber: nextSession.rollNumber },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
  );

  return res.json({
    token: nextToken,
    session: {
      id: nextSession._id,
      name: nextSession.name,
      rollNumber: nextSession.rollNumber,
      slotId: nextSession.slotId,
      slotName: nextSession.slotName,
      selectedLanguage: nextSession.selectedLanguage,
      code: nextSession.code,
      startedAt: nextSession.startedAt,
      status: nextSession.status,
      tabSwitchCount: nextSession.tabSwitchCount || 0,
      fullscreenExitCount: nextSession.fullscreenExitCount || 0,
      copyAttemptCount: nextSession.copyAttemptCount || 0,
      pasteAttemptCount: nextSession.pasteAttemptCount || 0,
      attemptSummary: getAttemptSummaryByRollNumber(nextSession.rollNumber),
      attemptHistory: getAttemptHistoryByRollNumber(nextSession.rollNumber),
      contestState,
      question: {
        id: question._id,
        title: question.title,
        hint: question.hint,
        category: question.category,
        pythonCode: question.pythonCode,
        difficulty: question.difficulty,
        expectedTimeSeconds: question.expectedTimeSeconds
      }
    }
  });
});

export default router;
