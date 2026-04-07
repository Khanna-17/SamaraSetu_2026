import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import socket from "../lib/socket";
import ParticleBackground from "../components/ParticleBackground";
import GlassCard from "../components/GlassCard";
import NeonButton from "../components/NeonButton";
import LeaderboardPanel from "../components/LeaderboardPanel";

function AdminApiHeader() {
  return { headers: { "X-Admin": "1" } };
}

export default function AdminDashboardPage() {
  const [participants, setParticipants] = useState([]);
  const [analytics, setAnalytics] = useState({ avgScore: 0, maxScore: 0, completionRate: 0, total: 0, submitted: 0 });
  const [questions, setQuestions] = useState([]);
  const [contestState, setContestState] = useState({ mode: "live", message: "Contest is live." });
  const [activeId, setActiveId] = useState("");
  const [detail, setDetail] = useState(null);
  const [editor, setEditor] = useState({
    title: "",
    pythonCode: "",
    difficulty: "medium",
    category: "logic",
    hint: "",
    expectedTimeSeconds: 900,
    testCasesText: '[\n  { "stdin": "1 2", "expectedOutput": "3" }\n]'
  });
  const [editorError, setEditorError] = useState("");

  async function loadAll() {
    const [pRes, aRes, qRes, cRes] = await Promise.all([
      api.get("/admin/participants", AdminApiHeader()),
      api.get("/admin/analytics", AdminApiHeader()),
      api.get("/admin/questions", AdminApiHeader()),
      api.get("/admin/contest-state", AdminApiHeader())
    ]);

    setParticipants(pRes.data.participants || []);
    setAnalytics(aRes.data);
    setQuestions(qRes.data.questions || []);
    setContestState(cRes.data.contestState || { mode: "live", message: "Contest is live." });
  }

  async function loadDetail(id) {
    if (!id) {
      setDetail(null);
      return;
    }
    const { data } = await api.get(`/admin/participant/${id}`, AdminApiHeader());
    setDetail(data.participant);
  }

  useEffect(() => {
    loadAll();

    socket.connect();
    socket.emit("join-admin-room", localStorage.getItem("arena_admin_token"));

    const onParticipantUpdated = () => {
      loadAll();
    };
    const onContestStateUpdated = (nextState) => {
      setContestState(nextState || { mode: "live", message: "Contest is live." });
    };

    socket.on("participant-updated", onParticipantUpdated);
    socket.on("contest-state-updated", onContestStateUpdated);

    return () => {
      socket.off("participant-updated", onParticipantUpdated);
      socket.off("contest-state-updated", onContestStateUpdated);
    };
  }, []);

  useEffect(() => {
    loadDetail(activeId);
  }, [activeId]);

  useEffect(() => {
    if (activeId) {
      loadDetail(activeId);
    }
  }, [participants]);

  async function createQuestion() {
    setEditorError("");

    let testCases;
    try {
      testCases = JSON.parse(editor.testCasesText);
    } catch {
      setEditorError("Test cases must be valid JSON.");
      return;
    }

    await api.post(
      "/admin/questions",
      {
        title: editor.title,
        pythonCode: editor.pythonCode,
        difficulty: editor.difficulty,
        category: editor.category,
        hint: editor.hint,
        expectedTimeSeconds: Number(editor.expectedTimeSeconds) || 900,
        testCases
      },
      AdminApiHeader()
    );
    setEditor({
      title: "",
      pythonCode: "",
      difficulty: "medium",
      category: "logic",
      hint: "",
      expectedTimeSeconds: 900,
      testCasesText: '[\n  { "stdin": "1 2", "expectedOutput": "3" }\n]'
    });
    loadAll();
  }

  async function deleteQuestion(id) {
    await api.delete(`/admin/questions/${id}`, AdminApiHeader());
    loadAll();
  }

  async function resetGame() {
    await api.post("/admin/reset", {}, AdminApiHeader());
    loadAll();
    setActiveId("");
    setDetail(null);
  }

  async function changeContestState(mode) {
    const defaultMessage =
      mode === "live"
        ? "Contest is live."
        : mode === "paused"
          ? "Contest is paused by admin."
          : "Contest has been stopped by admin.";

    const { data } = await api.post(
      "/admin/contest-state",
      { mode, message: defaultMessage },
      AdminApiHeader()
    );
    setContestState(data.contestState);
  }

  async function exportCsv() {
    const response = await api.get("/admin/export", {
      ...AdminApiHeader(),
      responseType: "blob"
    });

    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "arena-results.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const completionText = useMemo(() => `${analytics.completionRate || 0}%`, [analytics.completionRate]);

  return (
    <main className="relative min-h-screen bg-black px-4 py-6 text-sky-50">
      <ParticleBackground />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
        <GlassCard className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Admin Control Room</p>
              <h1 className="mt-2 font-display text-3xl text-slate-50">Contest Overview</h1>
              <p className="mt-2 text-sm text-slate-400">{contestState.message}</p>
            </div>
            <StatusPill mode={contestState.mode} />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Metric title="Average" value={analytics.avgScore} />
            <Metric title="Highest" value={analytics.maxScore} />
            <Metric title="Completion" value={completionText} />
            <Metric title="Participants" value={`${analytics.submitted}/${analytics.total}`} />
          </div>
          <div className="flex flex-wrap gap-3 border-t border-slate-800/80 pt-2">
            <NeonButton className="bg-cyan-300/16 text-cyan-50 hover:bg-cyan-300/22" onClick={() => changeContestState("live")}>Go Live</NeonButton>
            <NeonButton onClick={() => changeContestState("paused")}>Pause</NeonButton>
            <NeonButton className="border-slate-700/70 bg-slate-950/55 text-slate-200 hover:bg-slate-900/70" onClick={() => changeContestState("stopped")}>Stop</NeonButton>
            <NeonButton className="ml-auto" onClick={exportCsv}>Export CSV</NeonButton>
          </div>
        </GlassCard>

        <LeaderboardPanel />

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-slate-50">Participants</h2>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Live monitoring</p>
            </div>
            <div className="overflow-auto rounded-3xl border border-slate-800/90 bg-slate-950/55">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="sticky top-0 bg-slate-950/95 text-left text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Roll</th>
                    <th className="px-4 py-3">Language</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Questions</th>
                    <th className="px-4 py-3">Correct</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Integrity</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr
                      key={p._id}
                      className={`cursor-pointer border-t border-slate-800/85 transition hover:bg-slate-900/70 ${activeId === p._id ? "bg-slate-900/82" : ""}`}
                      onClick={() => setActiveId(p._id)}
                    >
                      <td className="px-4 py-3 text-slate-100">{p.name}</td>
                      <td className="px-4 py-3 text-slate-300">{p.rollNumber}</td>
                      <td className="px-4 py-3 text-slate-300">{p.selectedLanguage}</td>
                      <td className="px-4 py-3 text-cyan-200">{p.scoreBreakdown?.finalScore || 0}</td>
                      <td className="px-4 py-3 text-slate-300">{p.totalQuestionsAttempted || 0}</td>
                      <td className="px-4 py-3 text-slate-300">{p.totalCorrect || 0}</td>
                      <td className="px-4 py-3 text-slate-400">{p.timeTaken || 0}s</td>
                      <td className="px-4 py-3 text-slate-400">
                        T {p.tabSwitchCount || 0} | C {p.copyAttemptCount || 0} | P {p.pasteAttemptCount || 0}
                      </td>
                      <td className="px-4 py-3"><RowStatus status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-slate-50">Participant Detail</h2>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Deep inspection</p>
            </div>
            {!detail ? <p className="text-sm text-slate-400">Select a participant to inspect code, failed cases, and attempt history.</p> : null}
            {detail ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailCard label="Name" value={detail.name} />
                  <DetailCard label="Roll" value={detail.rollNumber} />
                  <DetailCard label="Question" value={detail.assignedQuestion?.title || "-"} />
                  <DetailCard label="Category" value={detail.assignedQuestion?.category || "logic"} />
                  <DetailCard label="Total score" value={detail.scoreBreakdown?.finalScore || 0} accent />
                  <DetailCard label="Questions attempted" value={detail.totalQuestionsAttempted || 0} />
                  <DetailCard label="Total correct" value={detail.totalCorrect || 0} accent />
                  <DetailCard label="Tests" value={`${detail.testReport?.passed || 0}/${detail.testReport?.total || 0}`} />
                </div>

                <div className="rounded-3xl border border-slate-800/90 bg-slate-950/68 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Integrity Signals</p>
                  <div className="mt-3 grid gap-2 text-sm text-slate-300">
                    <IntegrityLine label="Tab switches" value={detail.tabSwitchCount || 0} />
                    <IntegrityLine label="Copy attempts" value={detail.copyAttemptCount || 0} />
                    <IntegrityLine label="Paste attempts" value={detail.pasteAttemptCount || 0} />
                    <IntegrityLine label="Language warnings" value={(detail.testReport?.diagnostics?.languageWarnings || []).join(", ") || "None"} />
                    <IntegrityLine label="I/O warnings" value={(detail.testReport?.diagnostics?.ioWarnings || []).join(", ") || "None"} />
                    <IntegrityLine label="Missing signals" value={(detail.testReport?.diagnostics?.missingQuestionSignals || []).join(", ") || "None"} />
                  </div>
                </div>

                {(detail.attemptHistory || []).length ? (
                  <div className="rounded-3xl border border-slate-800/90 bg-slate-950/68 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Attempt History</p>
                    <div className="mt-3 space-y-2">
                      {(detail.attemptHistory || []).map((attempt) => (
                        <div key={attempt.sessionId} className="rounded-2xl border border-slate-800 bg-black/35 p-3 text-xs text-slate-300">
                          <p className="text-slate-100">Attempt {attempt.attemptNumber}: {attempt.questionTitle}</p>
                          <p className="mt-1 text-slate-400">{attempt.difficulty} | {attempt.category}</p>
                          <p className="mt-1 text-cyan-200">{attempt.passed}/{attempt.total} tests | Score {attempt.finalScore}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(detail.testReport?.failedCases || []).length ? (
                  <div className="rounded-3xl border border-slate-800/90 bg-slate-950/68 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Failed Cases</p>
                    <div className="mt-3 space-y-2">
                      {(detail.testReport.failedCases || []).map((item, index) => (
                        <div key={`${item.stdin}-${index}`} className="rounded-2xl border border-slate-800 bg-black/35 p-3 text-xs text-slate-300">
                          <p>Input: {item.stdin || "[empty]"}</p>
                          <p className="mt-1">Expected: {item.expectedOutput || "[empty]"}</p>
                          <p className="mt-1">Observed: {item.actualOutput || "[empty]"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-3xl border border-slate-800/90 bg-slate-950/68 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Submitted Code</p>
                  <pre className="mt-3 max-h-56 overflow-auto rounded-2xl border border-slate-800 bg-black/50 p-3 text-xs text-slate-200">{detail.code}</pre>
                </div>
              </div>
            ) : null}
          </GlassCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-slate-50">Question Bank</h2>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{questions.length} loaded</p>
            </div>
            <div className="max-h-80 space-y-2 overflow-auto pr-1">
              {questions.map((question) => (
                <div key={question._id} className="flex items-center justify-between gap-3 rounded-3xl border border-slate-800/90 bg-slate-950/68 px-4 py-3 text-sm">
                  <div>
                    <p className="text-slate-100">{question.qid}. {question.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{question.difficulty} | {question.category}</p>
                  </div>
                  <NeonButton className="px-3 py-1 text-xs" onClick={() => deleteQuestion(question._id)}>Delete</NeonButton>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-slate-50">Add Question</h2>
              <NeonButton className="border-slate-700/70 bg-slate-950/55 text-slate-200 hover:bg-slate-900/70" onClick={resetGame}>Reset Game</NeonButton>
            </div>
            <input placeholder="Title" value={editor.title} onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-black/45 px-4 py-3 text-slate-100 outline-none" />
            <select value={editor.difficulty} onChange={(e) => setEditor((prev) => ({ ...prev, difficulty: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-black/45 px-4 py-3 text-slate-100 outline-none">
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
            <input placeholder="Category (e.g. arrays, strings, recursion)" value={editor.category} onChange={(e) => setEditor((prev) => ({ ...prev, category: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-black/45 px-4 py-3 text-slate-100 outline-none" />
            <input placeholder="Hint" value={editor.hint} onChange={(e) => setEditor((prev) => ({ ...prev, hint: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-black/45 px-4 py-3 text-slate-100 outline-none" />
            <input type="number" min="30" max="7200" placeholder="Expected time (seconds)" value={editor.expectedTimeSeconds} onChange={(e) => setEditor((prev) => ({ ...prev, expectedTimeSeconds: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-black/45 px-4 py-3 text-slate-100 outline-none" />
            <textarea placeholder="Python code" value={editor.pythonCode} onChange={(e) => setEditor((prev) => ({ ...prev, pythonCode: e.target.value }))} className="h-36 w-full rounded-2xl border border-slate-800 bg-black/45 px-4 py-3 text-slate-100 outline-none" />
            <textarea placeholder="Test cases JSON" value={editor.testCasesText} onChange={(e) => setEditor((prev) => ({ ...prev, testCasesText: e.target.value }))} className="h-40 w-full rounded-2xl border border-slate-800 bg-black/45 px-4 py-3 font-mono text-xs text-slate-100 outline-none" />
            {editorError ? <p className="text-sm text-rose-300">{editorError}</p> : null}
            <NeonButton className="bg-cyan-300/16 text-cyan-50 hover:bg-cyan-300/22" onClick={createQuestion}>Create Question</NeonButton>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}

function Metric({ title, value }) {
  return (
    <div className="rounded-3xl border border-slate-800/90 bg-slate-950/68 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <p className="mt-3 font-display text-3xl text-slate-50">{value}</p>
    </div>
  );
}

function StatusPill({ mode }) {
  const palette =
    mode === "live"
      ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
      : mode === "paused"
        ? "border-amber-300/20 bg-amber-300/8 text-amber-100"
        : "border-slate-600/50 bg-slate-900/85 text-slate-200";

  return <span className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize ${palette}`}>{mode}</span>;
}

function RowStatus({ status }) {
  const palette =
    status === "submitted"
      ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
      : status === "in-progress"
        ? "border-amber-300/20 bg-amber-300/8 text-amber-100"
        : "border-slate-700/70 bg-slate-900/80 text-slate-300";

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${palette}`}>{status}</span>;
}

function DetailCard({ label, value, accent = false }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-cyan-300/20 bg-cyan-300/8" : "border-slate-800/90 bg-slate-950/68"}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-2 text-sm ${accent ? "text-cyan-100" : "text-slate-100"}`}>{value}</p>
    </div>
  );
}

function IntegrityLine({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-black/35 px-3 py-3">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-[58%] text-right text-slate-100">{value}</span>
    </div>
  );
}
