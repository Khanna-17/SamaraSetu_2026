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
      <div className="relative mx-auto flex max-w-7xl flex-col gap-4">
        <GlassCard className="grid gap-3 md:grid-cols-4">
          <Metric title="Average" value={analytics.avgScore} />
          <Metric title="Highest" value={analytics.maxScore} />
          <Metric title="Completion" value={completionText} />
          <Metric title="Participants" value={`${analytics.submitted}/${analytics.total}`} />
        </GlassCard>

        <GlassCard className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl text-sky-100">Contest Controls</h2>
              <p className="text-sm text-slate-300">{contestState.message}</p>
            </div>
            <p className="rounded-xl border border-sky-300/20 bg-black/35 px-3 py-2 text-sm text-sky-100">Mode: {contestState.mode}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <NeonButton onClick={() => changeContestState("live")}>Go Live</NeonButton>
            <NeonButton className="border-sky-700/50 bg-sky-900/20 text-sky-100 hover:bg-sky-900/35" onClick={() => changeContestState("paused")}>Pause</NeonButton>
            <NeonButton className="border-slate-700/70 bg-slate-950/55 text-sky-200 hover:bg-slate-900/70" onClick={() => changeContestState("stopped")}>Stop</NeonButton>
          </div>
        </GlassCard>

        <LeaderboardPanel />

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <GlassCard>
            <h2 className="font-display text-2xl text-sky-100">Participants</h2>
            <div className="mt-4 overflow-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="text-left text-sky-300">
                  <tr>
                    <th>Name</th>
                    <th>Roll</th>
                    <th>Language</th>
                    <th>Total Score</th>
                    <th>Questions</th>
                    <th>Total Correct</th>
                    <th>Time</th>
                    <th>Tab Switches</th>
                    <th>Copies</th>
                    <th>Pastes</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p._id} className="cursor-pointer border-t border-slate-700/60 hover:bg-slate-800/60" onClick={() => setActiveId(p._id)}>
                      <td className="py-2">{p.name}</td>
                      <td>{p.rollNumber}</td>
                      <td>{p.selectedLanguage}</td>
                      <td>{p.scoreBreakdown?.finalScore || 0}</td>
                      <td>{p.totalQuestionsAttempted || 0}</td>
                      <td>{p.totalCorrect || 0}</td>
                      <td>{p.timeTaken || 0}s</td>
                      <td>{p.tabSwitchCount || 0}</td>
                      <td>{p.copyAttemptCount || 0}</td>
                      <td>{p.pasteAttemptCount || 0}</td>
                      <td>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <h2 className="font-display text-2xl text-sky-100">Participant Detail</h2>
            {!detail ? <p className="text-sm text-slate-300">Select a participant to inspect code, test reports, and AI feedback.</p> : null}
            {detail ? (
              <div className="space-y-2 text-sm text-slate-300">
                <p><strong>Name:</strong> {detail.name}</p>
                <p><strong>Roll:</strong> {detail.rollNumber}</p>
                <p><strong>Question:</strong> {detail.assignedQuestion?.title}</p>
                <p><strong>Category:</strong> {detail.assignedQuestion?.category || "logic"}</p>
                <p><strong>Total score:</strong> {detail.scoreBreakdown?.finalScore || 0}</p>
                <p><strong>Total questions attempted:</strong> {detail.totalQuestionsAttempted || 0}</p>
                <p><strong>Total correct:</strong> {detail.totalCorrect || 0}</p>
                <p><strong>Tests:</strong> {detail.testReport?.passed || 0}/{detail.testReport?.total || 0}</p>
                <p><strong>Tab switches:</strong> {detail.tabSwitchCount || 0}</p>
                <p><strong>Copy attempts:</strong> {detail.copyAttemptCount || 0}</p>
                <p><strong>Paste attempts:</strong> {detail.pasteAttemptCount || 0}</p>
                <p><strong>Feedback:</strong> {detail.aiEvaluation?.feedback || ""}</p>
                <p><strong>Language warnings:</strong> {(detail.testReport?.diagnostics?.languageWarnings || []).join(", ") || "None"}</p>
                <p><strong>I/O warnings:</strong> {(detail.testReport?.diagnostics?.ioWarnings || []).join(", ") || "None"}</p>
                <p><strong>Missing signals:</strong> {(detail.testReport?.diagnostics?.missingQuestionSignals || []).join(", ") || "None"}</p>
                {(detail.attemptHistory || []).length ? (
                  <div className="space-y-2 pt-2">
                    <p className="text-sky-100">Attempt History</p>
                    {(detail.attemptHistory || []).map((attempt) => (
                      <div key={attempt.sessionId} className="rounded-xl border border-sky-300/15 bg-black/35 p-2 text-xs">
                        <p>Attempt {attempt.attemptNumber}: {attempt.questionTitle}</p>
                        <p>{attempt.difficulty} • {attempt.category}</p>
                        <p>{attempt.passed}/{attempt.total} tests • Score {attempt.finalScore}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {(detail.testReport?.failedCases || []).length ? (
                  <div className="space-y-2 pt-2">
                    <p className="text-sky-100">Failed Cases</p>
                    {(detail.testReport.failedCases || []).map((item, index) => (
                      <div key={`${item.stdin}-${index}`} className="rounded-xl border border-sky-900/35 bg-slate-950/50 p-2 text-xs">
                        <p>Input: {item.stdin || "[empty]"}</p>
                        <p>Expected: {item.expectedOutput || "[empty]"}</p>
                        <p>Observed: {item.actualOutput || "[empty]"}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                <pre className="max-h-44 overflow-auto rounded-xl border border-sky-300/20 bg-black/45 p-2 text-xs text-sky-100">{detail.code}</pre>
              </div>
            ) : null}
            <NeonButton className="border-sky-700/50 bg-sky-900/20 text-sky-100 hover:bg-sky-900/35" onClick={exportCsv}>Export CSV</NeonButton>
          </GlassCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <GlassCard>
            <h2 className="font-display text-2xl text-sky-100">Questions</h2>
            <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
              {questions.map((question) => (
                <div key={question._id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm">
                  <span>{question.qid}. {question.title} • {question.difficulty} • {question.category}</span>
                  <NeonButton className="px-3 py-1 text-xs" onClick={() => deleteQuestion(question._id)}>Delete</NeonButton>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="space-y-3">
            <h2 className="font-display text-2xl text-sky-100">Add Question</h2>
            <input placeholder="Title" value={editor.title} onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2" />
            <select value={editor.difficulty} onChange={(e) => setEditor((prev) => ({ ...prev, difficulty: e.target.value }))} className="w-full rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2">
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
            <input placeholder="Category (e.g. arrays, strings, recursion)" value={editor.category} onChange={(e) => setEditor((prev) => ({ ...prev, category: e.target.value }))} className="w-full rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2" />
            <input placeholder="Hint" value={editor.hint} onChange={(e) => setEditor((prev) => ({ ...prev, hint: e.target.value }))} className="w-full rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2" />
            <input type="number" min="30" max="7200" placeholder="Expected time (seconds)" value={editor.expectedTimeSeconds} onChange={(e) => setEditor((prev) => ({ ...prev, expectedTimeSeconds: e.target.value }))} className="w-full rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2" />
            <textarea placeholder="Python code" value={editor.pythonCode} onChange={(e) => setEditor((prev) => ({ ...prev, pythonCode: e.target.value }))} className="h-32 w-full rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2" />
            <textarea placeholder="Test cases JSON" value={editor.testCasesText} onChange={(e) => setEditor((prev) => ({ ...prev, testCasesText: e.target.value }))} className="h-36 w-full rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2 font-mono text-xs" />
            {editorError ? <p className="text-sm text-rose-300">{editorError}</p> : null}
            <div className="flex gap-2">
              <NeonButton onClick={createQuestion}>Create</NeonButton>
              <NeonButton className="border-slate-700/70 bg-slate-950/55 text-sky-200 hover:bg-slate-900/70" onClick={resetGame}>Reset Game</NeonButton>
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}

function Metric({ title, value }) {
  return (
    <div className="rounded-2xl border border-sky-300/25 bg-black/35 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-sky-400">{title}</p>
      <p className="mt-2 font-display text-3xl text-sky-100">{value}</p>
    </div>
  );
}
