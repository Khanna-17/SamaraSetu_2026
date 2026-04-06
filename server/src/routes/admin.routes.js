import { Router } from "express";
import jwt from "jsonwebtoken";
import { body } from "express-validator";
import { stringify } from "csv-stringify/sync";
import { validateRequest } from "../middleware/validate.js";
import { requireAdmin } from "../middleware/auth.js";
import { UserSession } from "../models/UserSession.js";
import { Question } from "../models/Question.js";

const router = Router();

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
  const participants = await UserSession.find()
    .sort({ updatedAt: -1 })
    .select("name rollNumber selectedLanguage scoreBreakdown timeTaken status");

  res.json({ participants });
});

router.get("/analytics", requireAdmin, async (_req, res) => {
  const total = await UserSession.countDocuments();
  const submitted = await UserSession.countDocuments({ status: "submitted" });
  const scoreAgg = await UserSession.aggregate([
    { $match: { status: "submitted" } },
    {
      $group: {
        _id: null,
        avgScore: { $avg: "$scoreBreakdown.finalScore" },
        maxScore: { $max: "$scoreBreakdown.finalScore" }
      }
    }
  ]);

  const avgScore = Number((scoreAgg[0]?.avgScore || 0).toFixed(2));
  const maxScore = Number((scoreAgg[0]?.maxScore || 0).toFixed(2));
  const completionRate = total ? Number(((submitted / total) * 100).toFixed(2)) : 0;

  res.json({ avgScore, maxScore, completionRate, total, submitted });
});

router.get("/participant/:id", requireAdmin, async (req, res) => {
  const participant = await UserSession.findById(req.params.id).populate("assignedQuestion");
  if (!participant) {
    return res.status(404).json({ message: "Not found" });
  }

  return res.json({ participant });
});

router.get("/questions", requireAdmin, async (_req, res) => {
  const questions = await Question.find().sort({ qid: 1 });
  res.json({ questions });
});

router.post(
  "/questions",
  requireAdmin,
  [body("title").isString(), body("pythonCode").isString(), body("difficulty").isString()],
  validateRequest,
  async (req, res) => {
    const currentMax = await Question.findOne().sort({ qid: -1 }).select("qid");
    const nextQid = Number(currentMax?.qid || 0) + 1;

    const question = await Question.create({
      qid: req.body.qid || nextQid,
      title: req.body.title,
      pythonCode: req.body.pythonCode,
      difficulty: req.body.difficulty,
      hint: req.body.hint || "",
      expectedTimeSeconds: req.body.expectedTimeSeconds || 900,
      testCases: Array.isArray(req.body.testCases) ? req.body.testCases : []
    });
    res.status(201).json({ question });
  }
);

router.put("/questions/:id", requireAdmin, async (req, res) => {
  const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!question) {
    return res.status(404).json({ message: "Not found" });
  }
  return res.json({ question });
});

router.delete("/questions/:id", requireAdmin, async (req, res) => {
  await Question.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.post("/reset", requireAdmin, async (_req, res) => {
  await UserSession.deleteMany({});
  await Question.updateMany({}, { $set: { assignedCount: 0 } });
  res.json({ ok: true });
});

router.get("/export", requireAdmin, async (_req, res) => {
  const rows = await UserSession.find()
    .sort({ createdAt: -1 })
    .select("name rollNumber selectedLanguage scoreBreakdown timeTaken status");

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
