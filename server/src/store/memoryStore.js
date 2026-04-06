import crypto from "crypto";
import { questionBank } from "../data/questions.js";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createQuestionId(qid) {
  return `question-${qid}`;
}

function createSessionId() {
  return crypto.randomUUID();
}

function createQuestions() {
  return questionBank.map((question) => ({
    _id: createQuestionId(question.qid),
    qid: question.qid,
    title: question.title,
    hint: question.hint || "",
    pythonCode: question.pythonCode,
    testCases: deepClone(question.testCases || []),
    difficulty: question.difficulty || "medium",
    assignedCount: 0,
    expectedTimeSeconds: Number(question.expectedTimeSeconds) || 900,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

const state = {
  questions: createQuestions(),
  sessions: []
};

function touch(entity) {
  entity.updatedAt = new Date().toISOString();
}

export function getQuestionById(id) {
  return state.questions.find((question) => question._id === id) || null;
}

export function listQuestions() {
  return [...state.questions].sort((a, b) => a.qid - b.qid).map((question) => deepClone(question));
}

export function pickFairQuestion() {
  if (state.questions.length === 0) {
    throw new Error("No questions available");
  }

  const minAssignedCount = Math.min(...state.questions.map((question) => question.assignedCount || 0));
  const candidates = state.questions.filter((question) => (question.assignedCount || 0) === minAssignedCount);
  const question = candidates[Math.floor(Math.random() * candidates.length)];
  question.assignedCount += 1;
  touch(question);
  return deepClone(question);
}

export function createSession({ name, rollNumber, resumeKey, assignedQuestionId, code = "", selectedLanguage = "javascript" }) {
  const session = {
    _id: createSessionId(),
    name,
    rollNumber,
    resumeKey,
    assignedQuestion: assignedQuestionId,
    selectedLanguage,
    code,
    aiEvaluation: {
      functionalEquivalence: 0,
      logicalCorrectness: 0,
      timeComplexitySimilarity: 0,
      spaceComplexitySimilarity: 0,
      readability: 0,
      feedback: ""
    },
    testReport: {
      passed: 0,
      total: 0,
      failedCases: [],
      compileError: "",
      runtimeError: ""
    },
    scoreBreakdown: {
      accuracyScore: 0,
      aiScore: 0,
      timeScore: 0,
      finalScore: 0
    },
    startedAt: new Date().toISOString(),
    submittedAt: null,
    timeTaken: 0,
    status: "in-progress",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.sessions.push(session);
  return deepClone(session);
}

export function updateSession(sessionId, updates) {
  const session = state.sessions.find((entry) => entry._id === sessionId);
  if (!session) {
    return null;
  }

  Object.assign(session, deepClone(updates));
  touch(session);
  return deepClone(session);
}

export function getSessionById(sessionId) {
  const session = state.sessions.find((entry) => entry._id === sessionId);
  return session ? deepClone(session) : null;
}

export function getInProgressSessionByRollNumber(rollNumber) {
  const session = state.sessions.find(
    (entry) => entry.rollNumber === rollNumber && entry.status === "in-progress"
  );
  return session ? deepClone(session) : null;
}

export function listParticipants() {
  return [...state.sessions]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((session) => deepClone(session));
}

export function getParticipantDetail(sessionId) {
  return getSessionById(sessionId);
}

export function getAnalytics() {
  const total = state.sessions.length;
  const submittedSessions = state.sessions.filter((session) => session.status === "submitted");
  const submitted = submittedSessions.length;
  const scores = submittedSessions.map((session) => Number(session.scoreBreakdown?.finalScore || 0));
  const avgScore = scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)) : 0;
  const maxScore = scores.length ? Number(Math.max(...scores).toFixed(2)) : 0;
  const completionRate = total ? Number(((submitted / total) * 100).toFixed(2)) : 0;

  return { avgScore, maxScore, completionRate, total, submitted };
}

export function createQuestion(payload) {
  const currentMax = state.questions.reduce((max, question) => Math.max(max, question.qid), 0);
  const question = {
    _id: createSessionId(),
    qid: payload.qid || currentMax + 1,
    title: payload.title,
    pythonCode: payload.pythonCode,
    difficulty: payload.difficulty,
    hint: payload.hint || "",
    expectedTimeSeconds: Number(payload.expectedTimeSeconds) || 900,
    testCases: deepClone(payload.testCases || []),
    assignedCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.questions.push(question);
  return deepClone(question);
}

export function updateQuestion(questionId, payload) {
  const question = state.questions.find((entry) => entry._id === questionId);
  if (!question) {
    return null;
  }

  Object.assign(question, deepClone(payload), {
    expectedTimeSeconds: Number(payload.expectedTimeSeconds) || 900
  });
  touch(question);
  return deepClone(question);
}

export function deleteQuestion(questionId) {
  const index = state.questions.findIndex((entry) => entry._id === questionId);
  if (index === -1) {
    return false;
  }

  state.questions.splice(index, 1);
  return true;
}

export function resetSessionData() {
  state.sessions = [];
  state.questions = state.questions.map((question) => ({
    ...question,
    assignedCount: 0,
    updatedAt: new Date().toISOString()
  }));
}

export function getLeaderboard() {
  return state.sessions
    .filter((session) => session.status === "submitted")
    .sort((a, b) => {
      const scoreDiff = Number(b.scoreBreakdown?.finalScore || 0) - Number(a.scoreBreakdown?.finalScore || 0);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return Number(a.timeTaken || 0) - Number(b.timeTaken || 0);
    })
    .slice(0, 20)
    .map((session) => deepClone(session));
}

export function getExportRows() {
  return [...state.sessions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((session) => deepClone(session));
}
