import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import socket from "../lib/socket";
import ParticleBackground from "../components/ParticleBackground";
import GlassCard from "../components/GlassCard";
import NeonButton from "../components/NeonButton";

export default function EntryPage() {
  const [form, setForm] = useState({ name: "", rollNumber: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [contestState, setContestState] = useState({ mode: "live", message: "Contest is live." });
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/contest-state").then(({ data }) => {
      setContestState(data.contestState || { mode: "live", message: "Contest is live." });
    }).catch(() => {});

    socket.connect();
    const onContestStateUpdated = (nextState) => {
      setContestState(nextState);
    };
    socket.on("contest-state-updated", onContestStateUpdated);

    return () => {
      socket.off("contest-state-updated", onContestStateUpdated);
    };
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");

    if (contestState.mode !== "live") {
      setError(contestState.message || "Contest is not accepting entries right now.");
      return;
    }

    if (!form.name.trim() || !form.rollNumber.trim()) {
      setError("Both fields are required.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/entry", {
        name: form.name.trim(),
        rollNumber: form.rollNumber.trim(),
        resumeKey: localStorage.getItem("arena_resume_key") || undefined
      });

      localStorage.setItem("arena_user_token", data.token);
      localStorage.setItem("arena_resume_key", data.resumeKey);
      localStorage.setItem("arena_session", JSON.stringify(data.session));
      navigate("/game");
    } catch (err) {
      setError(err.response?.data?.message || "Could not enter arena");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-10 text-sky-50">
      <ParticleBackground />
      <div className="relative mx-auto grid max-w-6xl gap-6 md:grid-cols-[1.3fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <GlassCard>
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-sky-400">Code Translation Arena</p>
            <h1 className="font-display text-4xl leading-tight text-sky-100 md:text-5xl">Translate Python. Beat the clock. Top the board.</h1>
            <p className="mt-4 text-slate-300">Take on multiple Python challenges, translate them into your target language, and get scored with hidden tests plus AI feedback.</p>
            <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${contestState.mode === "live" ? "border-sky-300/25 bg-sky-100/5 text-sky-100" : "border-slate-700/60 bg-slate-900/50 text-sky-200"}`}>
              {contestState.message || "Contest status updated."}
            </p>

            <form className="mt-8 space-y-4" onSubmit={onSubmit}>
              <label className="block text-sm text-sky-100">
                Name
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2 outline-none ring-sky-300 transition focus:ring"
                  placeholder="Your name"
                />
              </label>
              <label className="block text-sm text-sky-100">
                Roll Number
                <input
                  value={form.rollNumber}
                  onChange={(event) => setForm((prev) => ({ ...prev, rollNumber: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2 outline-none ring-sky-300 transition focus:ring"
                  placeholder="e.g. CS24-007"
                />
              </label>
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <NeonButton type="submit" disabled={loading || contestState.mode !== "live"}>{loading ? "Entering..." : "Enter Arena"}</NeonButton>
                <NeonButton type="button" className="border-slate-600/70 bg-slate-900/50 text-sky-100 hover:bg-slate-800/70" onClick={() => navigate("/admin")}>Admin</NeonButton>
              </div>
            </form>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>
          <GlassCard className="h-full space-y-4">
            <h2 className="font-display text-2xl text-sky-100">Before You Start</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>1. You can attempt multiple balanced Python questions.</li>
              <li>2. Admin chooses and starts one active slot for everyone.</li>
              <li>3. Hidden tests decide accuracy.</li>
              <li>4. AI gives feedback, but only testcase passing affects score.</li>
              <li>5. Language cheat sheet will be visible during the challenge.</li>
            </ul>
            <p className="rounded-2xl border border-sky-900/40 bg-slate-950/45 p-4 text-sm text-slate-300">
              Leaderboard access is available in the admin console only.
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  );
}
