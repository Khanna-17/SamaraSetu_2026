import { Router } from "express";
import { body } from "express-validator";
import { requireUser } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { evaluateWithJudge0 } from "../services/judge0.js";
import { evaluateWithAi } from "../services/aiEvaluator.js";
import { computeAiTotal, computeFinalScore, computeTimeScore } from "../services/scoring.js";
import { getIo } from "../config/socket.js";
import { getQuestionById, getSessionById, updateSession } from "../store/memoryStore.js";

const router = Router();

const allowedLanguages = ["c", "cpp", "java", "javascript"];

function sanitizeCode(rawCode) {
  const maxLength = Number(process.env.MAX_CODE_LENGTH || 15000);
  const code = String(rawCode || "").slice(0, maxLength);
  return code.replace(/\u0000/g, "");
}

router.get("/session", requireUser, async (req, res) => {
  const session = getSessionById(req.user.sessionId);

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  const assignedQuestion = getQuestionById(session.assignedQuestion);

  return res.json({
    session: {
      id: session._id,
      name: session.name,
      rollNumber: session.rollNumber,
      selectedLanguage: session.selectedLanguage,
      code: session.code,
      startedAt: session.startedAt,
      timeTaken: session.timeTaken,
      status: session.status,
      question: {
        id: assignedQuestion._id,
        title: assignedQuestion.title,
        hint: assignedQuestion.hint,
        pythonCode: assignedQuestion.pythonCode,
        difficulty: assignedQuestion.difficulty,
        expectedTimeSeconds: assignedQuestion.expectedTimeSeconds
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
    const payload = {};

    if (typeof req.body.code === "string") {
      payload.code = sanitizeCode(req.body.code);
    }

    if (allowedLanguages.includes(req.body.selectedLanguage)) {
      payload.selectedLanguage = req.body.selectedLanguage;
    }

    if (typeof req.body.timeTaken === "number") {
      payload.timeTaken = req.body.timeTaken;
    }

    const session = getSessionById(req.user.sessionId);
    if (!session || session.status !== "in-progress") {
      return res.status(404).json({ message: "Session not found" });
    }

    updateSession(req.user.sessionId, payload);

    res.json({ ok: true });
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

    const judgeResult = await evaluateWithJudge0({
      sourceCode: code,
      language: selectedLanguage,
      testCases: assignedQuestion.testCases,
      sourcePython: assignedQuestion.pythonCode,
      questionTitle: assignedQuestion.title
    });

    const aiEvaluation = await evaluateWithAi({
      sourcePython: assignedQuestion.pythonCode,
      userCode: code,
      targetLanguage: selectedLanguage
    });

    const aiScore = computeAiTotal(aiEvaluation);
    const timeScore = computeTimeScore(timeTaken, assignedQuestion.expectedTimeSeconds);
    const finalScore = computeFinalScore({
      accuracyScore: judgeResult.accuracyScore,
      aiScore,
      timeScore
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
        failedCases: judgeResult.details.filter((x) => !x.passed).map((x) => x.stdin),
        compileError: judgeResult.compileError,
        runtimeError: judgeResult.runtimeError,
        evaluationMode: judgeResult.evaluationMode || "internal-heuristic"
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
        timeTaken
      });
      io.to("leaderboard-room").emit("leaderboard-refresh");
    }

    return res.json({
      scoreBreakdown: updatedSession.scoreBreakdown,
      testReport: updatedSession.testReport,
      aiEvaluation: updatedSession.aiEvaluation,
      judgeDiagnostics: judgeResult.diagnostics || {}
    });
  }
);

export default router;
