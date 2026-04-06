import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import ParticleBackground from "../components/ParticleBackground";
import GlassCard from "../components/GlassCard";
import NeonButton from "../components/NeonButton";

export default function ResultPage() {
  const navigate = useNavigate();
  const [loadingNext, setLoadingNext] = useState(false);
  const [nextError, setNextError] = useState("");
  const result = useMemo(() => {
    const raw = localStorage.getItem("arena_result");
    return raw ? JSON.parse(raw) : null;
  }, []);

  if (!result) {
    return <main className="grid min-h-screen place-items-center bg-black text-amber-100">No result available.</main>;
  }

  const finalScore = result.scoreBreakdown?.finalScore || 0;
  const highScore = finalScore >= 85;
  const canAttemptMore = Boolean(result.attemptSummary?.canAttemptMore);
  const diagnostics = result.testReport?.diagnostics || result.judgeDiagnostics || {};

  async function nextQuestion() {
    setLoadingNext(true);
    setNextError("");
    try {
      const { data } = await api.post("/game/next-question");
      localStorage.setItem("arena_user_token", data.token);
      localStorage.setItem("arena_session", JSON.stringify(data.session));
      localStorage.removeItem("arena_result");
      navigate("/game");
    } catch (error) {
      setNextError(error.response?.data?.message || error.message || "Could not load the next question.");
    } finally {
      setLoadingNext(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-black px-4 py-10 text-amber-50">
      {highScore ? <Confetti numberOfPieces={240} recycle={false} /> : null}
      <ParticleBackground />
      <div className="relative mx-auto max-w-4xl space-y-5">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.2em] text-amber-400">Mission Complete</p>
          <motion.h1
            className="font-display text-6xl text-amber-100"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 140 }}
          >
            {finalScore}
          </motion.h1>
          <p className="mt-2 text-slate-300">Final Score</p>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard>
            <h3 className="font-display text-xl text-amber-100">Tests</h3>
            <p className="mt-3 text-2xl text-red-300">{result.testReport?.passed || 0} / {result.testReport?.total || 0}</p>
          </GlassCard>
          <GlassCard>
            <h3 className="font-display text-xl text-amber-100">Accuracy</h3>
            <p className="mt-3 text-2xl text-amber-300">{result.scoreBreakdown?.accuracyScore || 0}</p>
          </GlassCard>
          <GlassCard>
            <h3 className="font-display text-xl text-amber-100">Scoring Rule</h3>
            <p className="mt-3 text-sm text-amber-200">Final score is based only on testcase pass percentage.</p>
          </GlassCard>
        </div>

        <GlassCard>
          <h3 className="font-display text-2xl text-amber-100">AI Feedback</h3>
          <p className="mt-2 text-slate-300">{result.aiEvaluation?.feedback || "Solid work."}</p>
          {result.testReport?.compileError ? <p className="mt-3 text-sm text-rose-300">Compile Error: {result.testReport.compileError}</p> : null}
          {result.testReport?.runtimeError ? <p className="mt-3 text-sm text-rose-300">Runtime Error: {result.testReport.runtimeError}</p> : null}
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-2xl text-amber-100">Submission Diagnostics</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="text-sm text-slate-300">
              <p>Structure score: {diagnostics.structureScore || 0}</p>
              <p>Language score: {diagnostics.languageScore || 0}</p>
              <p>Question score: {diagnostics.questionScore || 0}</p>
              <p>I/O score: {diagnostics.ioScore || 0}</p>
            </div>
            <div className="text-sm text-slate-300">
              <p>Language warnings: {(diagnostics.languageWarnings || []).join(", ") || "None"}</p>
              <p>I/O warnings: {(diagnostics.ioWarnings || []).join(", ") || "None"}</p>
              <p>Missing signals: {(diagnostics.missingQuestionSignals || []).join(", ") || "None"}</p>
            </div>
          </div>
          {result.testReport?.failedCases?.length ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-amber-100">Failed cases</p>
              {result.testReport.failedCases.map((item, index) => (
                <div key={`${item.stdin}-${index}`} className="rounded-xl border border-red-900/35 bg-red-950/20 p-3 text-xs text-slate-300">
                  <p>Input: {item.stdin || "[empty]"}</p>
                  <p>Expected: {item.expectedOutput || "[empty]"}</p>
                  <p>Observed: {item.actualOutput || "[empty]"}</p>
                  <p>Status: {item.status}</p>
                </div>
              ))}
            </div>
          ) : null}
        </GlassCard>

        <GlassCard>
          <h3 className="font-display text-2xl text-amber-100">Attempt History</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {(result.attemptHistory || []).length ? (
              result.attemptHistory.map((attempt) => (
                <div key={attempt.sessionId} className="rounded-xl border border-amber-300/15 bg-black/35 p-3 text-sm text-slate-300">
                  <p className="text-amber-100">Attempt {attempt.attemptNumber}: {attempt.questionTitle}</p>
                  <p>{attempt.difficulty} • {attempt.category}</p>
                  <p>{attempt.passed}/{attempt.total} tests • Score {attempt.finalScore}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No attempt history available.</p>
            )}
          </div>
        </GlassCard>

        <div className="flex gap-3">
          {canAttemptMore ? (
            <NeonButton className="border-red-800/60 bg-red-900/20 text-amber-100 hover:bg-red-900/35" onClick={nextQuestion} disabled={loadingNext}>
              {loadingNext ? "Loading..." : "Next Question"}
            </NeonButton>
          ) : null}
          <NeonButton onClick={() => navigate("/")}>Back to Home</NeonButton>
          <NeonButton
            className="border-red-950/70 bg-red-950/35 text-red-200 hover:bg-red-950/55"
            onClick={() => {
              localStorage.removeItem("arena_user_token");
              localStorage.removeItem("arena_resume_key");
              localStorage.removeItem("arena_session");
              localStorage.removeItem("arena_result");
              navigate("/");
            }}
          >
            End Session
          </NeonButton>
        </div>
        {nextError ? <p className="text-sm text-rose-300">{nextError}</p> : null}
      </div>
    </main>
  );
}
