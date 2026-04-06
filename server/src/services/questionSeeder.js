import { Question } from "../models/Question.js";
import { questionBank } from "../data/questions.js";

export async function seedQuestions() {
  const count = await Question.countDocuments();
  if (count >= 30) {
    return;
  }

  for (const question of questionBank) {
    await Question.updateOne(
      { qid: question.qid },
      { $set: question },
      { upsert: true }
    );
  }

  console.log("Question bank seeded");
}
