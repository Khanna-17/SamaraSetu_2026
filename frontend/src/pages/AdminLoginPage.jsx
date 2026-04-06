import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import GlassCard from "../components/GlassCard";
import NeonButton from "../components/NeonButton";
import ParticleBackground from "../components/ParticleBackground";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/admin/login", { username, password });
      localStorage.setItem("arena_admin_token", data.token);
      navigate("/admin/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.request ? "Backend unreachable or blocked by CORS" : null) ||
        error.message ||
        "Login failed";
      setError(message);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-black px-4 py-8 text-amber-50">
      <ParticleBackground />
      <GlassCard className="relative w-full max-w-lg">
        <h1 className="font-display text-3xl text-amber-100">Admin Console</h1>
        <p className="mt-2 text-sm text-slate-300">Monitor participants, questions, and scoring in real time.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-amber-300/25 bg-black/45 px-3 py-2" placeholder="Username" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-amber-300/25 bg-black/45 px-3 py-2" placeholder="Password" />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <NeonButton type="submit">Login</NeonButton>
        </form>
      </GlassCard>
    </main>
  );
}
