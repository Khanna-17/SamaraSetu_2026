import { Router } from "express";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import { stringify } from "csv-stringify/sync";
import { validateRequest } from "../middleware/validate.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  createQuestion,
  deleteQuestion,
  getAnalytics,
  getExportRows,
  getParticipantDetail,
  listParticipants,
  listQuestions,
  resetSessionData,
  updateQuestion,
  getQuestionById
} from "../store/memoryStore.js";

const router = Router();
const questionValidators = [
  body("title").trim().isLength({ min: 3, max: 160 }),
  body("pythonCode").trim().isLength({ min: 1 }),
  body("difficulty").isIn(["easy", "medium", "hard"]),
  body("hint").optional().isString(),
  body("expectedTimeSeconds").optional().isInt({ min: 30, max: 7200 }),
  body("testCases").isArray({ min: 1 }).withMessage("At least one test case is required."),
  body("testCases.*.stdin").optional().isString(),
  body("testCases.*.expectedOutput")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Each test case needs a non-empty expected output.")
];

router.post(
  "/login",
  [body("username").isString(), body("password").isString()],
  validateRequest,
  async (req, res) => {
    const { username, password } = req.body;

    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ role: "admin", username }, process.env.JWT_SECRET, {
      expiresIn: "12h"
    });

    return res.json({ token });
  }
);

router.get("/participants", requireAdmin, async (_req, res) => {
  const participants = listParticipants();
  res.json({ participants });
});

router.get("/analytics", requireAdmin, async (_req, res) => {
  res.json(getAnalytics());
});

router.get("/participant/:id", requireAdmin, async (req, res) => {
  const participant = getParticipantDetail(req.params.id);
  if (!participant) {
    return res.status(404).json({ message: "Not found" });
  }

  participant.assignedQuestion = getQuestionById(participant.assignedQuestion);
  return res.json({ participant });
});

router.get("/questions", requireAdmin, async (_req, res) => {
  res.json({ questions: listQuestions() });
});

router.post(
  "/questions",
  requireAdmin,
  questionValidators,
  validateRequest,
  async (req, res) => {
    const question = createQuestion({
      qid: req.body.qid,
      title: req.body.title,
      pythonCode: req.body.pythonCode,
      difficulty: req.body.difficulty,
      hint: req.body.hint || "",
      expectedTimeSeconds: Number(req.body.expectedTimeSeconds) || 900,
      testCases: req.body.testCases
    });
    res.status(201).json({ question });
  }
);

router.put(
  "/questions/:id",
  requireAdmin,
  questionValidators,
  validateRequest,
  async (req, res) => {
    const question = updateQuestion(req.params.id, {
      ...req.body,
      expectedTimeSeconds: Number(req.body.expectedTimeSeconds) || 900
    });
    if (!question) {
      return res.status(404).json({ message: "Not found" });
    }
    return res.json({ question });
  }
);

router.delete("/questions/:id", requireAdmin, async (req, res) => {
  deleteQuestion(req.params.id);
  res.json({ ok: true });
});

router.post("/reset", requireAdmin, async (_req, res) => {
  resetSessionData();
  res.json({ ok: true });
});

router.get("/export", requireAdmin, async (_req, res) => {
  const rows = getExportRows();

  const csv = stringify(
    rows.map((x) => ({
      name: x.name,
      rollNumber: x.rollNumber,
      selectedLanguage: x.selectedLanguage,
      finalScore: x.scoreBreakdown?.finalScore || 0,
      timeTaken: x.timeTaken || 0,
      status: x.status
    })),
    { header: true }
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=arena-results.csv");
  res.send(csv);
});

export default router;
