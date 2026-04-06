import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import ParticleBackground from "../components/ParticleBackground";
import GlassCard from "../components/GlassCard";
import NeonButton from "../components/NeonButton";
import LeaderboardPanel from "../components/LeaderboardPanel";

export default function EntryPage() {
  const [form, setForm] = useState({ name: "", rollNumber: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(event) {
    event.preventDefault();
    setError("");

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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <ParticleBackground />
      <div className="relative mx-auto grid max-w-6xl gap-6 md:grid-cols-[1.3fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <GlassCard>
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-cyan-300">Code Translation Arena</p>
            <h1 className="font-display text-4xl leading-tight text-cyan-100 md:text-5xl">Translate Python. Beat the clock. Top the board.</h1>
            <p className="mt-4 text-slate-300">One random Python challenge. One language target. Full scoring with hidden tests and AI logic analysis. Finish fast and climb the board.</p>

            <form className="mt-8 space-y-4" onSubmit={onSubmit}>
              <label className="block text-sm text-cyan-100">
                Name
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-cyan-200/30 bg-slate-900/70 px-3 py-2 outline-none ring-cyan-300 transition focus:ring"
                  placeholder="Your name"
                />
              </label>
              <label className="block text-sm text-cyan-100">
                Roll Number
                <input
                  value={form.rollNumber}
                  onChange={(event) => setForm((prev) => ({ ...prev, rollNumber: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-cyan-200/30 bg-slate-900/70 px-3 py-2 outline-none ring-cyan-300 transition focus:ring"
                  placeholder="e.g. CS24-007"
                />
              </label>

              {error ? <p className="text-sm text-rose-300">{error}</p> : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <NeonButton type="submit" disabled={loading}>{loading ? "Entering..." : "Enter Arena"}</NeonButton>
                <NeonButton type="button" className="border-fuchsia-300/50 bg-fuchsia-300/10 text-fuchsia-100" onClick={() => navigate("/admin")}>Admin</NeonButton>
              </div>
            </form>
          </GlassCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>
          <GlassCard className="h-full space-y-4">
            <h2 className="font-display text-2xl text-cyan-100">Before You Start</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>1. You get exactly one random Python question.</li>
              <li>2. Translate into C, C++, Java, or JavaScript.</li>
              <li>3. Hidden tests decide accuracy.</li>
              <li>4. AI checks logic and code quality.</li>
              <li>5. Faster completion gives time bonus.</li>
            </ul>
            <LeaderboardPanel />
          </GlassCard>
        </motion.div>
      </div>
    </main>
  );
}
