import { Router } from "express";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validate.js";
import { UserSession } from "../models/UserSession.js";
import { pickFairQuestion } from "../services/questionSelector.js";

const router = Router();

router.post(
  "/entry",
  [
    body("name").trim().isLength({ min: 2, max: 80 }),
    body("rollNumber").trim().matches(/^[A-Za-z0-9_-]{3,25}$/)
  ],
  validateRequest,
  async (req, res) => {
    const { name, rollNumber } = req.body;

    let session = await UserSession.findOne({
      rollNumber,
      status: "in-progress"
    }).populate("assignedQuestion");

    if (!session) {
      const question = await pickFairQuestion();
      session = await UserSession.create({
        name,
        rollNumber,
        assignedQuestion: question._id,
        code: "",
        selectedLanguage: "javascript"
      });
      await session.populate("assignedQuestion");
    }

    const token = jwt.sign(
      { sessionId: session._id.toString(), role: "user", rollNumber },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
    );

    res.json({
      token,
      session: {
        id: session._id,
        name: session.name,
        rollNumber: session.rollNumber,
        selectedLanguage: session.selectedLanguage,
        code: session.code,
        startedAt: session.startedAt,
        status: session.status,
        question: {
          id: session.assignedQuestion._id,
          title: session.assignedQuestion.title,
          hint: session.assignedQuestion.hint,
          pythonCode: session.assignedQuestion.pythonCode,
          difficulty: session.assignedQuestion.difficulty,
          expectedTimeSeconds: session.assignedQuestion.expectedTimeSeconds
        }
      }
    });
  }
);

export default router;
