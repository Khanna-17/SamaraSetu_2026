import mongoose from "mongoose";

const userSessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true, index: true },
    resumeKey: { type: String, required: true, select: false },
    assignedQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true
    },
    selectedLanguage: {
      type: String,
      enum: ["c", "cpp", "java", "javascript"],
      default: "javascript"
    },
    code: { type: String, default: "" },
    aiEvaluation: {
      functionalEquivalence: { type: Number, default: 0 },
      logicalCorrectness: { type: Number, default: 0 },
      timeComplexitySimilarity: { type: Number, default: 0 },
      spaceComplexitySimilarity: { type: Number, default: 0 },
      readability: { type: Number, default: 0 },
      feedback: { type: String, default: "" }
    },
    testReport: {
      passed: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      failedCases: { type: [String], default: [] },
      compileError: { type: String, default: "" },
      runtimeError: { type: String, default: "" }
    },
    scoreBreakdown: {
      accuracyScore: { type: Number, default: 0 },
      aiScore: { type: Number, default: 0 },
      timeScore: { type: Number, default: 0 },
      finalScore: { type: Number, default: 0 }
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    timeTaken: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["in-progress", "submitted"],
      default: "in-progress"
    }
  },
  { timestamps: true }
);

userSessionSchema.index({ rollNumber: 1, status: 1 });

export const UserSession = mongoose.model("UserSession", userSessionSchema);
