import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { getLeaderboard } from "../store/memoryStore.js";

const router = Router();

router.get("/live", requireAdmin, async (_req, res) => {
  const leaders = getLeaderboard();

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
