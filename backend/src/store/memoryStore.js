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

function inferQuestionCategory({ title = "", pythonCode = "", hint = "" }) {
  const text = `${title} ${hint} ${pythonCode}`.toLowerCase();

  if (text.includes("fib(") || text.includes("return rev(") || text.includes("return n + f(")) {
    return "recursion";
  }
  if (text.includes("sort") || text.includes("sorted(")) {
    return "sorting";
  }
  if (text.includes("dict") || text.includes("set(") || text.includes("seen = set")) {
    return "hashing";
  }
  if (text.includes("math") || text.includes("gcd") || text.includes("lcm") || text.includes("prime")) {
    return "math";
  }
  if (text.includes("input().split") || text.includes("list(map") || text.includes("arr =")) {
    return "arrays";
  }
  if (text.includes("strip") || text.includes("[::-1]") || text.includes("lower()") || text.includes("string")) {
    return "strings";
  }

  return "logic";
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
    category: question.category || inferQuestionCategory(question),
    assignedCount: 0,
    expectedTimeSeconds: Number(question.expectedTimeSeconds) || 900,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
}

const state = {
  questions: createQuestions(),
  sessions: [],
  contest: {
    mode: "live",
    message: "Contest is live.",
    updatedAt: new Date().toISOString()
  }
};

function getLatestSession(sessions = []) {
  return [...sessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] || null;
}

function buildParticipantAggregate(rollNumber) {
  const sessions = state.sessions.filter((entry) => entry.rollNumber === rollNumber);
  if (!sessions.length) {
    return null;
  }

  const latestSession = getLatestSession(sessions);
  const attemptHistory = getAttemptHistoryByRollNumber(rollNumber);
  const totalScore = Number(
    sessions.reduce((sum, entry) => sum + Number(entry.scoreBreakdown?.finalScore || 0), 0).toFixed(2)
  );
  const totalQuestionsAttempted = sessions.length;
  const totalCorrect = sessions.filter((entry) => {
    const total = Number(entry.testReport?.total || 0);
    return total > 0 && Number(entry.testReport?.passed || 0) === total;
  }).length;

  return {
    _id: rollNumber,
    sessionId: latestSession._id,
    name: latestSession.name,
    rollNumber: latestSession.rollNumber,
    selectedLanguage: latestSession.selectedLanguage,
    assignedQuestion: latestSession.assignedQuestion,
    status: latestSession.status,
    timeTaken: sessions.reduce((sum, entry) => sum + Number(entry.timeTaken || 0), 0),
    tabSwitchCount: sessions.reduce((sum, entry) => sum + Number(entry.tabSwitchCount || 0), 0),
    copyAttemptCount: sessions.reduce((sum, entry) => sum + Number(entry.copyAttemptCount || 0), 0),
    pasteAttemptCount: sessions.reduce((sum, entry) => sum + Number(entry.pasteAttemptCount || 0), 0),
    totalQuestionsAttempted,
    totalCorrect,
    attemptHistory,
    scoreBreakdown: {
      accuracyScore: latestSession.scoreBreakdown?.accuracyScore || 0,
      aiScore: latestSession.scoreBreakdown?.aiScore || 0,
      timeScore: latestSession.scoreBreakdown?.timeScore || 0,
      finalScore: totalScore
    },
    aiEvaluation: latestSession.aiEvaluation,
    testReport: latestSession.testReport,
    code: latestSession.code,
    createdAt: latestSession.createdAt,
    updatedAt: latestSession.updatedAt,
    submittedAt: latestSession.submittedAt
  };
}

function touch(entity) {
  entity.updatedAt = new Date().toISOString();
}

export function getQuestionById(id) {
  return state.questions.find((question) => question._id === id) || null;
}

export function listQuestions() {
  return [...state.questions].sort((a, b) => a.qid - b.qid).map((question) => deepClone(question));
}

export function pickFairQuestion({ excludeQuestionIds = [], rollNumber = "" } = {}) {
  const excluded = new Set(excludeQuestionIds);
  const availableQuestions = state.questions.filter((question) => !excluded.has(question._id));

  if (availableQuestions.length === 0) {
    throw new Error("No questions available");
  }

  const priorAttempts = state.sessions.filter((session) => session.rollNumber === rollNumber);
  const difficultyCounts = priorAttempts.reduce((acc, session) => {
    const question = getQuestionById(session.assignedQuestion);
    if (question) {
      acc[question.difficulty] = (acc[question.difficulty] || 0) + 1;
    }
    return acc;
  }, {});
  const categoryCounts = priorAttempts.reduce((acc, session) => {
    const question = getQuestionById(session.assignedQuestion);
    if (question) {
      acc[question.category] = (acc[question.category] || 0) + 1;
    }
    return acc;
  }, {});

  const rankedCandidates = [...availableQuestions].sort((a, b) => {
    const assignedDiff = Number(a.assignedCount || 0) - Number(b.assignedCount || 0);
    if (assignedDiff !== 0) {
      return assignedDiff;
    }

    const difficultyDiff =
      Number(difficultyCounts[a.difficulty] || 0) - Number(difficultyCounts[b.difficulty] || 0);
    if (difficultyDiff !== 0) {
      return difficultyDiff;
    }

    const categoryDiff =
      Number(categoryCounts[a.category] || 0) - Number(categoryCounts[b.category] || 0);
    if (categoryDiff !== 0) {
      return categoryDiff;
    }

    return Number(a.qid || 0) - Number(b.qid || 0);
  });

  const topRank = rankedCandidates[0];
  const candidates = rankedCandidates.filter((question) => (
    Number(question.assignedCount || 0) === Number(topRank.assignedCount || 0) &&
    Number(difficultyCounts[question.difficulty] || 0) === Number(difficultyCounts[topRank.difficulty] || 0) &&
    Number(categoryCounts[question.category] || 0) === Number(categoryCounts[topRank.category] || 0)
  ));
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
      runtimeError: "",
      diagnostics: {
        structureScore: 0,
        languageScore: 0,
        questionScore: 0,
        ioScore: 0,
        missingQuestionSignals: [],
        languageWarnings: [],
        ioWarnings: []
      }
    },
    tabSwitchCount: 0,
    copyAttemptCount: 0,
    pasteAttemptCount: 0,
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

export function getAttemptedQuestionIdsByRollNumber(rollNumber) {
  return Array.from(
    new Set(
      state.sessions
        .filter((entry) => entry.rollNumber === rollNumber)
        .map((entry) => entry.assignedQuestion)
    )
  );
}

export function getAttemptSummaryByRollNumber(rollNumber) {
  const attempts = state.sessions.filter((entry) => entry.rollNumber === rollNumber);
  const attemptedQuestionIds = getAttemptedQuestionIdsByRollNumber(rollNumber);
  const submittedCount = attempts.filter((entry) => entry.status === "submitted").length;
  const totalQuestions = state.questions.length;
  const remainingQuestions = Math.max(totalQuestions - attemptedQuestionIds.length, 0);

  return {
    totalAttempts: attempts.length,
    submittedCount,
    attemptedQuestionCount: attemptedQuestionIds.length,
    totalQuestions,
    remainingQuestions,
    canAttemptMore: remainingQuestions > 0
  };
}

export function getAttemptHistoryByRollNumber(rollNumber) {
  return state.sessions
    .filter((entry) => entry.rollNumber === rollNumber)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((entry, index) => {
      const question = getQuestionById(entry.assignedQuestion);
      return {
        sessionId: entry._id,
        attemptNumber: index + 1,
        status: entry.status,
        selectedLanguage: entry.selectedLanguage,
        questionId: question?._id || entry.assignedQuestion,
        questionTitle: question?.title || "Unknown Question",
        category: question?.category || "logic",
        difficulty: question?.difficulty || "medium",
        passed: entry.testReport?.passed || 0,
        total: entry.testReport?.total || 0,
        finalScore: entry.scoreBreakdown?.finalScore || 0,
        accuracyScore: entry.scoreBreakdown?.accuracyScore || 0,
        timeTaken: entry.timeTaken || 0,
        submittedAt: entry.submittedAt,
        createdAt: entry.createdAt
      };
    });
}

export function listParticipants() {
  return Array.from(new Set(state.sessions.map((session) => session.rollNumber)))
    .map((rollNumber) => buildParticipantAggregate(rollNumber))
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((participant) => deepClone(participant));
}

export function getParticipantDetail(sessionId) {
  return deepClone(buildParticipantAggregate(sessionId));
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
    category: payload.category || inferQuestionCategory(payload),
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
    expectedTimeSeconds: Number(payload.expectedTimeSeconds) || 900,
    category: payload.category || question.category || inferQuestionCategory({ ...question, ...payload })
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

export function getContestState() {
  return deepClone(state.contest);
}

export function updateContestState(payload = {}) {
  state.contest = {
    ...state.contest,
    ...deepClone(payload),
    updatedAt: new Date().toISOString()
  };
  return deepClone(state.contest);
}

export function getLeaderboard() {
  return listParticipants()
    .filter((participant) => participant.totalQuestionsAttempted > 0)
    .sort((a, b) => {
      const scoreDiff = Number(b.scoreBreakdown?.finalScore || 0) - Number(a.scoreBreakdown?.finalScore || 0);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return Number(a.timeTaken || 0) - Number(b.timeTaken || 0);
    })
    .slice(0, 20)
    .map((participant) => deepClone(participant));
}

export function getExportRows() {
  return [...state.sessions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((session) => deepClone(session));
}
