import { useEffect, useState } from "react";
import api from "../lib/api";
import socket from "../lib/socket";

function AdminApiHeader() {
  return { headers: { "X-Admin": "1" } };
}

export default function LeaderboardPanel() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function loadLeaderboard() {
    const { data } = await api.get("/leaderboard/live", AdminApiHeader());
    setRows(data.leaderboard || []);
  }

  useEffect(() => {
    const adminToken = localStorage.getItem("arena_admin_token");
    if (!adminToken) {
      setError("Admin login required.");
      return;
    }

    loadLeaderboard().catch(() => {
      setError("Could not load leaderboard.");
    });

    socket.connect();
    socket.emit("join-leaderboard-room", adminToken);

    const refresh = () => {
      loadLeaderboard().catch(() => {
        setError("Could not refresh leaderboard.");
      });
    };

    socket.on("leaderboard-refresh", refresh);

    return () => {
      socket.off("leaderboard-refresh", refresh);
    };
  }, []);

  return (
    <div className="rounded-3xl border border-slate-800/90 bg-slate-950/68 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-xl text-slate-50">Live Leaderboard</h3>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Admin only</p>
      </div>
      <div className="max-h-56 space-y-2 overflow-auto pr-1">
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {rows.length === 0 ? <p className="text-sm text-slate-400">No finished runs yet.</p> : null}
        {rows.map((row) => (
          <div key={`${row.rollNumber}-${row.rank}`} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-black/35 px-4 py-3 text-sm text-slate-100">
            <span>
              #{row.rank} {row.name}
              <span className="ml-2 text-xs text-slate-500">
                {row.totalCorrect}/{row.totalQuestionsAttempted} correct
              </span>
            </span>
            <span className="text-cyan-200">{row.finalScore}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
