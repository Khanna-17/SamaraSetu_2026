import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { UserSession } from "../models/UserSession.js";

const router = Router();

router.get("/live", requireAdmin, async (_req, res) => {
  const leaders = await UserSession.find({ status: "submitted" })
    .sort({ "scoreBreakdown.finalScore": -1, timeTaken: 1 })
    .limit(20)
    .select("name rollNumber selectedLanguage scoreBreakdown timeTaken");

  res.json({
    leaderboard: leaders.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      rollNumber: user.rollNumber,
      selectedLanguage: user.selectedLanguage,
      finalScore: user.scoreBreakdown.finalScore,
      timeTaken: user.timeTaken
    }))
  });
});

export default router;
