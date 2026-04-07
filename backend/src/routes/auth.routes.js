import { Router } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validate.js";
import { pickFairQuestion } from "../services/questionSelector.js";
import {
  createSession,
  getActiveSlot,
  getAttemptHistoryByRollNumber,
  getAttemptSummaryByRollNumber,
  getContestState,
  getAttemptedQuestionIdsByRollNumber,
  getInProgressSessionByRollNumber,
  getQuestionById
} from "../store/memoryStore.js";

const router = Router();

router.post(
  "/entry",
  [
    body("name").trim().isLength({ min: 2, max: 80 }),
    body("rollNumber").trim().matches(/^[A-Za-z0-9_-]{3,25}$/),
    body("resumeKey").optional().isString().isLength({ min: 32, max: 128 })
  ],
  validateRequest,
  async (req, res) => {
    const { name, rollNumber, resumeKey } = req.body;
    const activeSlot = getActiveSlot();
    const contestState = getContestState();

    if (!activeSlot) {
      return res.status(423).json({
        message: "Slot is not started yet."
      });
    }

    if (contestState.mode !== "live") {
      return res.status(423).json({
        message: contestState.message || "Contest is not accepting entries right now.",
        contestState
      });
    }

    let session = getInProgressSessionByRollNumber(rollNumber);

    if (session && session.resumeKey !== resumeKey) {
      return res.status(409).json({
        message: "An active session already exists for this roll number on another device."
      });
    }

    if (!session) {
      const attemptedQuestionIds = getAttemptedQuestionIdsByRollNumber(rollNumber);
      const summary = getAttemptSummaryByRollNumber(rollNumber);
      if (!summary.canAttemptMore && attemptedQuestionIds.length > 0) {
        return res.status(409).json({
          message: "All available questions have already been attempted for this roll number."
        });
      }

      const question = await pickFairQuestion({ excludeQuestionIds: attemptedQuestionIds, rollNumber });
      session = createSession({
        name,
        rollNumber,
        resumeKey: crypto.randomBytes(24).toString("hex"),
        assignedQuestionId: question._id,
        code: "",
        selectedLanguage: activeSlot.language,
        slotId: activeSlot.slotId,
        slotName: activeSlot.name
      });
      session.assignedQuestion = question;
    } else {
      session.assignedQuestion = getQuestionById(session.assignedQuestion);
    }

    const attemptSummary = getAttemptSummaryByRollNumber(rollNumber);
    const attemptHistory = getAttemptHistoryByRollNumber(rollNumber);

    const token = jwt.sign(
      { sessionId: session._id.toString(), role: "user", rollNumber },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
    );

    res.json({
      token,
      resumeKey: session.resumeKey,
      session: {
        id: session._id,
        name: session.name,
        rollNumber: session.rollNumber,
        slotId: session.slotId,
        slotName: session.slotName,
        selectedLanguage: session.selectedLanguage,
        code: session.code,
        startedAt: session.startedAt,
        status: session.status,
        attemptSummary,
        attemptHistory,
        contestState,
        question: {
          id: session.assignedQuestion._id,
          title: session.assignedQuestion.title,
          hint: session.assignedQuestion.hint,
          category: session.assignedQuestion.category,
          pythonCode: session.assignedQuestion.pythonCode,
          difficulty: session.assignedQuestion.difficulty,
          expectedTimeSeconds: session.assignedQuestion.expectedTimeSeconds
        }
      }
    });
  }
);

export default router;
