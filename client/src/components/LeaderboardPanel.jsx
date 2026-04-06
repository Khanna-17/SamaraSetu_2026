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
    <div className="rounded-2xl border border-fuchsia-200/40 bg-fuchsia-950/30 p-4">
      <h3 className="mb-3 font-display text-lg text-fuchsia-100">Live Leaderboard</h3>
      <div className="max-h-56 space-y-2 overflow-auto pr-1">
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {rows.length === 0 ? <p className="text-sm text-slate-300">No finished runs yet.</p> : null}
        {rows.map((row) => (
          <div key={`${row.rollNumber}-${row.rank}`} className="flex items-center justify-between rounded-xl bg-slate-900/70 px-3 py-2 text-sm text-cyan-100">
            <span>
              #{row.rank} {row.name}
            </span>
            <span>{row.finalScore}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
