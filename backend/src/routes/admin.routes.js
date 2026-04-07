import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { body } from "express-validator";
import { stringify } from "csv-stringify/sync";
import { validateRequest } from "../middleware/validate.js";
import { requireAdmin } from "../middleware/auth.js";
import { getIo } from "../config/socket.js";
import {
  createSlot,
  createQuestion,
  deleteQuestion,
  getActiveSlot,
  getAnalytics,
  getClassicTranslationLanguages,
  getContestState,
  getAllowedTranslationLanguages,
  getLanguageMode,
  getExportRows,
  getExportRowsBySlot,
  getSlotTranslationLanguages,
  getParticipantDetail,
  listSlotLanguageAssignments,
  listParticipants,
  listQuestions,
  resetSessionData,
  startSlot,
  stopSlot,
  setSlotLanguageAssignment,
  setLanguageMode,
  updateSlot,
  updateContestState,
  updateQuestion,
  getQuestionById
} from "../store/memoryStore.js";

const router = Router();
const questionValidators = [
  body("title").trim().isLength({ min: 3, max: 160 }),
  body("pythonCode").trim().isLength({ min: 1 }),
  body("difficulty").isIn(["easy", "medium", "hard"]),
  body("category").optional().trim().isLength({ min: 2, max: 40 }),
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

async function isAdminPasswordValid(password) {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH || "";
  if (passwordHash) {
    return bcrypt.compare(password, passwordHash);
  }

  const configuredPassword = process.env.ADMIN_PASSWORD || "";
  if (configuredPassword.startsWith("$2")) {
    return bcrypt.compare(password, configuredPassword);
  }

  return password === configuredPassword;
}

router.post(
  "/login",
  [body("username").isString(), body("password").isString(), body("otp").optional().isString()],
  validateRequest,
  async (req, res) => {
    const { username, password, otp } = req.body;

    if (username !== process.env.ADMIN_USERNAME || !(await isAdminPasswordValid(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (process.env.ADMIN_OTP && otp !== process.env.ADMIN_OTP) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const token = jwt.sign({ role: "admin", username }, process.env.JWT_SECRET, {
      expiresIn: "12h"
    });

    return res.json({ token, otpEnabled: Boolean(process.env.ADMIN_OTP) });
  }
);

router.get("/participants", requireAdmin, async (_req, res) => {
  const participants = listParticipants();
  res.json({ participants });
});

router.get("/analytics", requireAdmin, async (_req, res) => {
  res.json(getAnalytics());
});

router.get("/contest-state", requireAdmin, async (_req, res) => {
  res.json({ contestState: getContestState() });
});

router.get("/slots", requireAdmin, async (_req, res) => {
  res.json({
    slots: listSlotLanguageAssignments(),
    activeSlot: getActiveSlot(),
    allowedLanguages: getAllowedTranslationLanguages(),
    slotLanguages: getSlotTranslationLanguages(),
    classicLanguages: getClassicTranslationLanguages(),
    languageMode: getLanguageMode()
  });
});

router.post(
  "/slots",
  requireAdmin,
  [
    body("name").isString().trim().isLength({ min: 2, max: 80 }),
    body("language").isIn(getSlotTranslationLanguages())
  ],
  validateRequest,
  async (req, res) => {
    const slot = createSlot({
      name: req.body.name,
      language: req.body.language
    });

    if (!slot) {
      return res.status(400).json({ message: "Invalid slot payload." });
    }

    return res.status(201).json({
      slot,
      slots: listSlotLanguageAssignments(),
      activeSlot: getActiveSlot(),
      allowedLanguages: getAllowedTranslationLanguages(),
      slotLanguages: getSlotTranslationLanguages(),
      classicLanguages: getClassicTranslationLanguages(),
      languageMode: getLanguageMode()
    });
  }
);

router.put(
  "/slots/:slotId",
  requireAdmin,
  [
    body("name").optional().isString().trim().isLength({ min: 2, max: 80 }),
    body("language").optional().isIn(getSlotTranslationLanguages())
  ],
  validateRequest,
  async (req, res) => {
    const slotId = String(req.params.slotId || "").trim().toLowerCase();
    const slot = updateSlot(slotId, {
      name: req.body.name,
      language: req.body.language
    });

    if (!slot) {
      return res.status(404).json({ message: "Slot not found." });
    }

    return res.json({
      slot,
      slots: listSlotLanguageAssignments(),
      activeSlot: getActiveSlot(),
      allowedLanguages: getAllowedTranslationLanguages(),
      slotLanguages: getSlotTranslationLanguages(),
      classicLanguages: getClassicTranslationLanguages(),
      languageMode: getLanguageMode()
    });
  }
);

router.post("/slots/:slotId/start", requireAdmin, async (req, res) => {
  const slotId = String(req.params.slotId || "").trim().toLowerCase();
  const slot = startSlot(slotId);
  if (!slot) {
    return res.status(404).json({ message: "Slot not found." });
  }

  return res.json({
    slot,
    slots: listSlotLanguageAssignments(),
    activeSlot: getActiveSlot(),
    allowedLanguages: getAllowedTranslationLanguages(),
    slotLanguages: getSlotTranslationLanguages(),
    classicLanguages: getClassicTranslationLanguages(),
    languageMode: getLanguageMode()
  });
});

router.post("/slots/:slotId/stop", requireAdmin, async (req, res) => {
  const slotId = String(req.params.slotId || "").trim().toLowerCase();
  const slot = stopSlot(slotId);
  if (!slot) {
    return res.status(404).json({ message: "Slot not found." });
  }

  return res.json({
    slot,
    slots: listSlotLanguageAssignments(),
    activeSlot: getActiveSlot(),
    allowedLanguages: getAllowedTranslationLanguages(),
    slotLanguages: getSlotTranslationLanguages(),
    classicLanguages: getClassicTranslationLanguages(),
    languageMode: getLanguageMode()
  });
});

router.post(
  "/slots/:slotId/language",
  requireAdmin,
  [body("language").isIn(getSlotTranslationLanguages())],
  validateRequest,
  async (req, res) => {
    const slotId = String(req.params.slotId || "").trim().toLowerCase();
    const language = String(req.body.language || "").trim().toLowerCase();
    const assignment = setSlotLanguageAssignment(slotId, language);

    if (!assignment) {
      return res.status(404).json({ message: "Slot not found." });
    }

    return res.json({
      assignment,
      slots: listSlotLanguageAssignments(),
      activeSlot: getActiveSlot(),
      allowedLanguages: getAllowedTranslationLanguages(),
      slotLanguages: getSlotTranslationLanguages(),
      classicLanguages: getClassicTranslationLanguages(),
      languageMode: getLanguageMode()
    });
  }
);

router.post(
  "/language-mode",
  requireAdmin,
  [body("mode").isIn(["slot", "classic"])],
  validateRequest,
  async (req, res) => {
    const languageMode = setLanguageMode(req.body.mode);
    const io = getIo();
    io?.emit("language-mode-updated", {
      languageMode,
      allowedLanguages: getAllowedTranslationLanguages()
    });

    return res.json({
      languageMode,
      allowedLanguages: getAllowedTranslationLanguages(),
      slotLanguages: getSlotTranslationLanguages(),
      classicLanguages: getClassicTranslationLanguages(),
      slots: listSlotLanguageAssignments(),
      activeSlot: getActiveSlot()
    });
  }
);

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
        category: req.body.category,
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

router.post(
  "/contest-state",
  requireAdmin,
  [
    body("mode").isIn(["live", "paused", "stopped"]),
    body("message").optional().isString().isLength({ max: 200 })
  ],
  validateRequest,
  async (req, res) => {
    const contestState = updateContestState({
      mode: req.body.mode,
      message:
        req.body.message ||
        (req.body.mode === "live"
          ? "Contest is live."
          : req.body.mode === "paused"
            ? "Contest is paused by admin."
            : "Contest has been stopped by admin.")
    });

    const io = getIo();
    io?.emit("contest-state-updated", contestState);

    res.json({ contestState });
  }
);

router.get("/export", requireAdmin, async (_req, res) => {
  const slotId = String(_req.query.slot || "").trim().toLowerCase();
  const rows = slotId ? getExportRowsBySlot(slotId) : getExportRows();

  const csv = stringify(
    rows.map((x) => ({
      name: x.name,
      rollNumber: x.rollNumber,
      slotId: x.slotId || "",
      selectedLanguage: x.selectedLanguage,
      finalScore: x.scoreBreakdown?.finalScore || 0,
      timeTaken: x.timeTaken || 0,
      status: x.status
    })),
    { header: true }
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${slotId ? `arena-results-${slotId}.csv` : "arena-results.csv"}`
  );
  res.send(csv);
});

export default router;
