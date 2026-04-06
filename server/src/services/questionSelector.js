import { Question } from "../models/Question.js";

export async function pickFairQuestion() {
  const minResult = await Question.findOne().sort({ assignedCount: 1 }).select("assignedCount");

  if (!minResult) {
    throw new Error("No questions available");
  }

  const minAssignedCount = minResult.assignedCount;
  const candidates = await Question.find({ assignedCount: minAssignedCount });
  const random = candidates[Math.floor(Math.random() * candidates.length)];

  await Question.updateOne({ _id: random._id }, { $inc: { assignedCount: 1 } });

  return random;
}
