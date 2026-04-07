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
  const [activeFailedCaseIndex, setActiveFailedCaseIndex] = useState(0);
  const result = useMemo(() => {
    const raw = localStorage.getItem("arena_result");
    return raw ? JSON.parse(raw) : null;
  }, []);

  if (!result) {
    return <main className="grid min-h-screen place-items-center bg-black text-sky-100">No result available.</main>;
  }

  const finalScore = result.scoreBreakdown?.finalScore || 0;
  const highScore = finalScore >= 85;
  const canAttemptMore = Boolean(result.attemptSummary?.canAttemptMore);
  const diagnostics = result.testReport?.diagnostics || result.judgeDiagnostics || {};
  const failedCases = result.testReport?.failedCases || [];
  const activeFailedCase = failedCases[activeFailedCaseIndex] || null;

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
    <main className="relative min-h-screen bg-black px-4 py-10 text-sky-50">
      {highScore ? <Confetti numberOfPieces={240} recycle={false} /> : null}
      <ParticleBackground />
      <div className="relative mx-auto max-w-5xl space-y-6">
        <GlassCard className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Mission Complete</p>
          <motion.h1
            className="font-display text-6xl text-slate-50"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 140 }}
          >
            {finalScore}
          </motion.h1>
          <p className="text-slate-400">Final Score</p>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard>
            <h3 className="font-display text-xl text-slate-50">Tests</h3>
            <p className="mt-4 text-3xl text-cyan-300">{result.testReport?.passed || 0} / {result.testReport?.total || 0}</p>
          </GlassCard>
          <GlassCard>
            <h3 className="font-display text-xl text-slate-50">Accuracy</h3>
            <p className="mt-4 text-3xl text-cyan-300">{result.scoreBreakdown?.accuracyScore || 0}</p>
          </GlassCard>
          <GlassCard>
            <h3 className="font-display text-xl text-slate-50">Scoring Rule</h3>
            <p className="mt-4 text-sm leading-6 text-slate-300">Final score is based only on testcase pass percentage.</p>
          </GlassCard>
        </div>

        <GlassCard className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl text-slate-50">Submission Review</h3>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Primary signal: testcase pass rate</p>
          </div>

          {(result.testReport?.compileError || result.testReport?.runtimeError) ? (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/8 p-4 text-sm text-rose-200">
              {result.testReport?.compileError ? <p>Compile Error: {result.testReport.compileError}</p> : null}
              {result.testReport?.runtimeError ? <p className={result.testReport?.compileError ? "mt-2" : ""}>Runtime Error: {result.testReport.runtimeError}</p> : null}
            </div>
          ) : null}

          {failedCases.length ? (
            <div className="space-y-4 rounded-3xl border border-slate-800/90 bg-slate-950/68 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-semibold text-slate-100">Failed Testcase Viewer</p>
                <p className="text-sm text-slate-500">Inspect one failure at a time</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {failedCases.map((item, index) => (
                  <button
                    key={`${item.stdin}-${index}`}
                    type="button"
                    onClick={() => setActiveFailedCaseIndex(index)}
                    className={`rounded-2xl border px-4 py-2 text-sm ${index === activeFailedCaseIndex ? "border-cyan-300/35 bg-cyan-300/10 text-cyan-100" : "border-slate-800 bg-black/40 text-slate-400"}`}
                  >
                    Case {index + 1}
                  </button>
                ))}
              </div>
              {activeFailedCase ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <CasePanel title="Input" value={activeFailedCase.stdin} />
                  <CasePanel title="Expected" value={activeFailedCase.expectedOutput} />
                  <CasePanel title="Observed" value={activeFailedCase.actualOutput} status={activeFailedCase.status} />
                </div>
              ) : null}
            </div>
          ) : null}

          <details className="rounded-3xl border border-slate-800/90 bg-slate-950/68 p-5">
            <summary className="cursor-pointer list-none text-lg font-semibold text-slate-100">
              Diagnostics Details
            </summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="text-sm leading-7 text-slate-300">
                <p>Structure score: {diagnostics.structureScore || 0}</p>
                <p>Language score: {diagnostics.languageScore || 0}</p>
                <p>Question score: {diagnostics.questionScore || 0}</p>
                <p>I/O score: {diagnostics.ioScore || 0}</p>
              </div>
              <div className="text-sm leading-7 text-slate-300">
                <p>Language warnings: {(diagnostics.languageWarnings || []).join(", ") || "None"}</p>
                <p>I/O warnings: {(diagnostics.ioWarnings || []).join(", ") || "None"}</p>
                <p>Missing signals: {(diagnostics.missingQuestionSignals || []).join(", ") || "None"}</p>
              </div>
            </div>
          </details>
        </GlassCard>

        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-2xl text-slate-50">Attempt History</h3>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Across this session</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(result.attemptHistory || []).length ? (
              result.attemptHistory.map((attempt) => (
                <div key={attempt.sessionId} className="rounded-3xl border border-slate-800/90 bg-slate-950/68 p-4 text-sm text-slate-300">
                  <p className="text-slate-100">Attempt {attempt.attemptNumber}: {attempt.questionTitle}</p>
                  <p className="mt-2 text-slate-400">{attempt.difficulty} | {attempt.category}</p>
                  <p className="mt-2 text-cyan-200">{attempt.passed}/{attempt.total} tests | Score {attempt.finalScore}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No attempt history available.</p>
            )}
          </div>
        </GlassCard>

        <div className="flex flex-wrap gap-3">
          {canAttemptMore ? (
            <NeonButton className="bg-cyan-300/16 text-cyan-50 hover:bg-cyan-300/22" onClick={nextQuestion} disabled={loadingNext}>
              {loadingNext ? "Loading..." : "Next Question"}
            </NeonButton>
          ) : null}
          <NeonButton onClick={() => navigate("/")}>Back to Home</NeonButton>
          <NeonButton
            className="border-slate-700/70 bg-slate-950/55 text-slate-200 hover:bg-slate-900/70"
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

function CasePanel({ title, value, status }) {
  return (
    <div className="rounded-3xl border border-slate-800/90 bg-black/45 p-4 text-xs text-slate-300">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-[11px] text-slate-200">{value || "[empty]"}</pre>
      {status ? <p className="mt-3 text-rose-200">{status}</p> : null}
    </div>
  );
}
