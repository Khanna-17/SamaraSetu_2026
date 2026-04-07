import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    stdin: { type: String, default: "" },
    expectedOutput: { type: String, required: true }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    qid: { type: Number, unique: true, index: true },
    title: { type: String, required: true },
    hint: { type: String, default: "" },
    pythonCode: { type: String, required: true },
    testCases: { type: [testCaseSchema], default: [] },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium"
    },
    assignedCount: { type: Number, default: 0 },
    expectedTimeSeconds: { type: Number, default: 900 }
  },
  { timestamps: true }
);

export const Question = mongoose.model("Question", questionSchema);
