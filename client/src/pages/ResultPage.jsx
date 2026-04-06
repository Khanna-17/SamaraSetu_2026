import { useMemo } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useNavigate } from "react-router-dom";
import ParticleBackground from "../components/ParticleBackground";
import GlassCard from "../components/GlassCard";
import NeonButton from "../components/NeonButton";

export default function ResultPage() {
  const navigate = useNavigate();
  const result = useMemo(() => {
    const raw = localStorage.getItem("arena_result");
    return raw ? JSON.parse(raw) : null;
  }, []);

  if (!result) {
    return <main className="grid min-h-screen place-items-center bg-slate-950 text-cyan-100">No result available.</main>;
  }

  const finalScore = result.scoreBreakdown?.finalScore || 0;
  const highScore = finalScore >= 85;

  return (
    <main className="relative min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      {highScore ? <Confetti numberOfPieces={240} recycle={false} /> : null}
      <ParticleBackground />
      <div className="relative mx-auto max-w-4xl space-y-5">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Mission Complete</p>
          <motion.h1
            className="font-display text-6xl text-cyan-100"
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
            <h3 className="font-display text-xl text-cyan-100">Tests</h3>
            <p className="mt-3 text-2xl text-emerald-300">{result.testReport?.passed || 0} / {result.testReport?.total || 0}</p>
          </GlassCard>
          <GlassCard>
            <h3 className="font-display text-xl text-cyan-100">AI Score</h3>
            <p className="mt-3 text-2xl text-fuchsia-300">{result.scoreBreakdown?.aiScore || 0}</p>
          </GlassCard>
          <GlassCard>
            <h3 className="font-display text-xl text-cyan-100">Time Score</h3>
            <p className="mt-3 text-2xl text-cyan-300">{result.scoreBreakdown?.timeScore || 0}</p>
          </GlassCard>
        </div>

        <GlassCard>
          <h3 className="font-display text-2xl text-cyan-100">AI Feedback</h3>
          <p className="mt-2 text-slate-300">{result.aiEvaluation?.feedback || "Solid work."}</p>
          {result.testReport?.compileError ? <p className="mt-3 text-sm text-rose-300">Compile Error: {result.testReport.compileError}</p> : null}
          {result.testReport?.runtimeError ? <p className="mt-3 text-sm text-rose-300">Runtime Error: {result.testReport.runtimeError}</p> : null}
        </GlassCard>

        <div className="flex gap-3">
          <NeonButton onClick={() => navigate("/")}>Back to Home</NeonButton>
          <NeonButton
            className="border-fuchsia-300/50 bg-fuchsia-300/10 text-fuchsia-100"
            onClick={() => {
              localStorage.removeItem("arena_user_token");
              localStorage.removeItem("arena_session");
              localStorage.removeItem("arena_result");
              navigate("/");
            }}
          >
            End Session
          </NeonButton>
        </div>
      </div>
    </main>
  );
}
