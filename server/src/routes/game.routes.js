import { Router } from "express";
import { body } from "express-validator";
import { requireUser } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validate.js";
import { UserSession } from "../models/UserSession.js";
import { evaluateWithJudge0 } from "../services/judge0.js";
import { evaluateWithAi } from "../services/aiEvaluator.js";
import { computeAiTotal, computeFinalScore, computeTimeScore } from "../services/scoring.js";
import { getIo } from "../config/socket.js";

const router = Router();

const allowedLanguages = ["c", "cpp", "java", "javascript"];

function sanitizeCode(rawCode) {
  const maxLength = Number(process.env.MAX_CODE_LENGTH || 15000);
  const code = String(rawCode || "").slice(0, maxLength);
  return code.replace(/\u0000/g, "");
}

router.get("/session", requireUser, async (req, res) => {
  const session = await UserSession.findById(req.user.sessionId).populate("assignedQuestion");

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

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
        id: session.assignedQuestion._id,
        title: session.assignedQuestion.title,
        hint: session.assignedQuestion.hint,
        pythonCode: session.assignedQuestion.pythonCode,
        difficulty: session.assignedQuestion.difficulty,
        expectedTimeSeconds: session.assignedQuestion.expectedTimeSeconds
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

    await UserSession.updateOne({ _id: req.user.sessionId, status: "in-progress" }, { $set: payload });

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
    const session = await UserSession.findById(req.user.sessionId).populate("assignedQuestion");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status === "submitted") {
      return res.status(409).json({ message: "Already submitted" });
    }

    const code = sanitizeCode(req.body.code);
    const selectedLanguage = req.body.selectedLanguage;
    const timeTaken = req.body.timeTaken;

    const judgeResult = await evaluateWithJudge0({
      sourceCode: code,
      language: selectedLanguage,
      testCases: session.assignedQuestion.testCases
    });

    const aiEvaluation = await evaluateWithAi({
      sourcePython: session.assignedQuestion.pythonCode,
      userCode: code,
      targetLanguage: selectedLanguage
    });

    const aiScore = computeAiTotal(aiEvaluation);
    const timeScore = computeTimeScore(timeTaken, session.assignedQuestion.expectedTimeSeconds);
    const finalScore = computeFinalScore({
      accuracyScore: judgeResult.accuracyScore,
      aiScore,
      timeScore
    });

    session.code = code;
    session.selectedLanguage = selectedLanguage;
    session.status = "submitted";
    session.submittedAt = new Date();
    session.timeTaken = timeTaken;
    session.aiEvaluation = aiEvaluation;
    session.scoreBreakdown = {
      accuracyScore: judgeResult.accuracyScore,
      aiScore,
      timeScore,
      finalScore
    };
    session.testReport = {
      passed: judgeResult.passed,
      total: judgeResult.total,
      failedCases: judgeResult.details.filter((x) => !x.passed).map((x) => x.stdin),
      compileError: judgeResult.compileError,
      runtimeError: judgeResult.runtimeError
    };

    await session.save();

    const io = getIo();
    if (io) {
      io.to("admin-room").emit("participant-updated", {
        id: session._id,
        name: session.name,
        rollNumber: session.rollNumber,
        selectedLanguage,
        finalScore,
        status: session.status,
        timeTaken
      });
      io.to("leaderboard-room").emit("leaderboard-refresh");
    }

    return res.json({
      scoreBreakdown: session.scoreBreakdown,
      testReport: session.testReport,
      aiEvaluation: session.aiEvaluation
    });
  }
);

export default router;
