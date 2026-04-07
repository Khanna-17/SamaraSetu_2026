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
  const [slots, setSlots] = useState([]);
  const [activeSlot, setActiveSlot] = useState(null);
  const [languageMode, setLanguageMode] = useState("slot");
  const [allowedLanguages, setAllowedLanguages] = useState(["go", "rust", "kotlin"]);
  const [slotLanguages, setSlotLanguages] = useState(["go", "rust", "kotlin"]);
  const [classicLanguages, setClassicLanguages] = useState(["java", "c", "cpp", "javascript"]);
  const [newSlotName, setNewSlotName] = useState("");
  const [newSlotLanguage, setNewSlotLanguage] = useState("go");
  const [slotDraftNames, setSlotDraftNames] = useState({});
  const [slotError, setSlotError] = useState("");
  const [exportSlotId, setExportSlotId] = useState("");
  const [activeId, setActiveId] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showQuestionModal, setShowQuestionModal] = useState(false);
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
    const [pRes, aRes, qRes, cRes, sRes] = await Promise.all([
      api.get("/admin/participants", AdminApiHeader()),
      api.get("/admin/analytics", AdminApiHeader()),
      api.get("/admin/questions", AdminApiHeader()),
      api.get("/admin/contest-state", AdminApiHeader()),
      api.get("/admin/slots", AdminApiHeader())
    ]);

    setParticipants(pRes.data.participants || []);
    setAnalytics(aRes.data);
    setQuestions(qRes.data.questions || []);
    setContestState(cRes.data.contestState || { mode: "live", message: "Contest is live." });
    setSlots(sRes.data.slots || []);
    setActiveSlot(sRes.data.activeSlot || null);
    setLanguageMode(sRes.data.languageMode || "slot");
    setAllowedLanguages(sRes.data.allowedLanguages || ["go", "rust", "kotlin"]);
    setSlotLanguages(sRes.data.slotLanguages || ["go", "rust", "kotlin"]);
    setClassicLanguages(sRes.data.classicLanguages || ["java", "c", "cpp", "javascript"]);
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
    socket.on("language-mode-updated", ({ languageMode: nextMode, allowedLanguages: nextAllowed }) => {
      setLanguageMode(nextMode || "slot");
      setAllowedLanguages(nextAllowed || []);
    });

    return () => {
      socket.off("participant-updated", onParticipantUpdated);
      socket.off("contest-state-updated", onContestStateUpdated);
      socket.off("language-mode-updated");
    };
  }, []);

  useEffect(() => {
    loadDetail(activeId);
  }, [activeId]);

  useEffect(() => {
    setSlotDraftNames((prev) => {
      const next = { ...prev };
      for (const slot of slots) {
        if (typeof next[slot.slotId] !== "string") {
          next[slot.slotId] = slot.name || "";
        }
      }
      return next;
    });
  }, [slots]);

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
      params: exportSlotId ? { slot: exportSlotId } : {},
      responseType: "blob"
    });

    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportSlotId ? `arena-results-${exportSlotId}.csv` : "arena-results.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function createSlot() {
    setSlotError("");
    const name = newSlotName.trim();
    if (!name) {
      setSlotError("Slot name is required.");
      return;
    }

    try {
      const { data } = await api.post(
        "/admin/slots",
        { name, language: newSlotLanguage },
        AdminApiHeader()
      );
      setSlots(data.slots || []);
      setActiveSlot(data.activeSlot || null);
      setAllowedLanguages(data.allowedLanguages || ["go", "rust", "kotlin"]);
      setNewSlotName("");
    } catch (err) {
      setSlotError(err.response?.data?.message || "Unable to create slot.");
    }
  }

  async function updateSlot(slotId, updates) {
    setSlotError("");
    try {
      const { data } = await api.put(`/admin/slots/${slotId}`, updates, AdminApiHeader());
      setSlots(data.slots || []);
      setActiveSlot(data.activeSlot || null);
      setAllowedLanguages(data.allowedLanguages || ["go", "rust", "kotlin"]);
    } catch (err) {
      setSlotError(err.response?.data?.message || "Unable to update slot.");
    }
  }

  async function startSelectedSlot(slotId) {
    setSlotError("");
    try {
      const { data } = await api.post(`/admin/slots/${slotId}/start`, {}, AdminApiHeader());
      setSlots(data.slots || []);
      setActiveSlot(data.activeSlot || null);
      setAllowedLanguages(data.allowedLanguages || ["go", "rust", "kotlin"]);
    } catch (err) {
      setSlotError(err.response?.data?.message || "Unable to start slot.");
    }
  }

  async function stopSelectedSlot(slotId) {
    setSlotError("");
    try {
      const { data } = await api.post(`/admin/slots/${slotId}/stop`, {}, AdminApiHeader());
      setSlots(data.slots || []);
      setActiveSlot(data.activeSlot || null);
      setAllowedLanguages(data.allowedLanguages || ["go", "rust", "kotlin"]);
    } catch (err) {
      setSlotError(err.response?.data?.message || "Unable to stop slot.");
    }
  }

  async function toggleLanguageMode() {
    const nextMode = languageMode === "slot" ? "classic" : "slot";
    setSlotError("");
    try {
      const { data } = await api.post("/admin/language-mode", { mode: nextMode }, AdminApiHeader());
      setLanguageMode(data.languageMode || nextMode);
      setAllowedLanguages(data.allowedLanguages || []);
      setSlotLanguages(data.slotLanguages || []);
      setClassicLanguages(data.classicLanguages || []);
      setSlots(data.slots || []);
      setActiveSlot(data.activeSlot || null);
    } catch (err) {
      setSlotError(err.response?.data?.message || "Unable to change language mode.");
    }
  }

  const completionText = useMemo(() => `${analytics.completionRate || 0}%`, [analytics.completionRate]);

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-black px-4 py-4 text-sky-50">
      <ParticleBackground />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col gap-3">
        <GlassCard className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl text-sky-100">Admin Console</h1>
            <div className="flex flex-wrap gap-2">
              <NeonButton className={`px-3 py-1.5 text-xs ${activeTab === "overview" ? "" : "border-slate-700/60 bg-slate-950/50 text-sky-200"}`} onClick={() => setActiveTab("overview")}>Overview</NeonButton>
              <NeonButton className={`px-3 py-1.5 text-xs ${activeTab === "participants" ? "" : "border-slate-700/60 bg-slate-950/50 text-sky-200"}`} onClick={() => setActiveTab("participants")}>Participants</NeonButton>
              <NeonButton className={`px-3 py-1.5 text-xs ${activeTab === "questions" ? "" : "border-slate-700/60 bg-slate-950/50 text-sky-200"}`} onClick={() => setActiveTab("questions")}>Questions</NeonButton>
            </div>
          </div>
        </GlassCard>

        {activeTab === "overview" ? (
          <>
            <GlassCard className="grid gap-3 md:grid-cols-4">
              <Metric title="Average" value={analytics.avgScore} />
              <Metric title="Highest" value={analytics.maxScore} />
              <Metric title="Completion" value={completionText} />
              <Metric title="Participants" value={`${analytics.submitted}/${analytics.total}`} />
            </GlassCard>

            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.2fr_1fr]">
              <GlassCard className="min-h-0 overflow-y-auto space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl text-sky-100">Contest Controls</h2>
                    <p className="text-sm text-slate-300">{contestState.message}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Language Set</p>
                      <p className="text-sm text-sky-100">{languageMode === "slot" ? "Slots: GO / RUST / KOTLIN" : "Classic: JAVA / C / CPP / JAVASCRIPT"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleLanguageMode}
                      title="Toggle language set"
                      className={`h-8 w-8 rounded-md border transition ${languageMode === "slot" ? "border-sky-300/45 bg-sky-300/18" : "border-slate-500/70 bg-slate-800/80"}`}
                    >
                      <span className="sr-only">Toggle language mode</span>
                    </button>
                    <p className="rounded-xl border border-sky-300/20 bg-black/35 px-3 py-2 text-sm text-sky-100">Mode: {contestState.mode}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <NeonButton onClick={() => changeContestState("live")}>Go Live</NeonButton>
                  <NeonButton className="border-sky-700/50 bg-sky-900/20 text-sky-100 hover:bg-sky-900/35" onClick={() => changeContestState("paused")}>Pause</NeonButton>
                  <NeonButton className="border-slate-700/70 bg-slate-950/55 text-sky-200 hover:bg-slate-900/70" onClick={() => changeContestState("stopped")}>Stop</NeonButton>
                </div>

                <div className="rounded-xl border border-sky-300/15 bg-black/35 p-3 text-sm text-slate-300">
                  <p>Enabled languages: {allowedLanguages.map((language) => language.toUpperCase()).join(" / ")}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {languageMode === "slot"
                      ? "Slot mode is active. Users get the language assigned by the started slot."
                      : "Classic mode is active. Users can choose their own language in the game page."}
                  </p>
                </div>

                {languageMode === "slot" ? (
                  <>
                    <div className="rounded-xl border border-sky-300/15 bg-black/35 p-3 text-sm text-slate-300">
                      <p>
                        Active slot: {activeSlot ? `${activeSlot.name} (${String(activeSlot.language || "").toUpperCase()})` : "None"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Users can join only when a slot is started.</p>
                    </div>

                    <div className="grid gap-2 md:grid-cols-[1.3fr_1fr_auto]">
                      <input value={newSlotName} onChange={(event) => setNewSlotName(event.target.value)} placeholder="New slot name" className="rounded-lg border border-sky-300/25 bg-black/55 px-2 py-1 text-sm text-sky-50" />
                      <select value={newSlotLanguage} onChange={(event) => setNewSlotLanguage(event.target.value)} className="rounded-lg border border-sky-300/25 bg-black/55 px-2 py-1 text-sm text-sky-50">
                        {slotLanguages.map((language) => (
                          <option key={language} value={language}>{language.toUpperCase()}</option>
                        ))}
                      </select>
                      <NeonButton onClick={createSlot}>Create Slot</NeonButton>
                    </div>

                    {slotError ? <p className="text-sm text-rose-300">{slotError}</p> : null}

                    <div className="grid gap-2 md:grid-cols-2">
                      {slots.map((slot) => (
                        <div key={slot.slotId} className="rounded-xl border border-sky-300/15 bg-black/35 p-3 text-sm text-slate-300">
                          <p className="text-sky-100">{slot.name || slot.slotId}</p>
                          <p className="text-xs text-slate-400">ID: {slot.slotId}</p>
                          <input
                            value={slotDraftNames[slot.slotId] ?? slot.name ?? ""}
                            onChange={(event) => setSlotDraftNames((prev) => ({ ...prev, [slot.slotId]: event.target.value }))}
                            className="mt-2 w-full rounded-lg border border-sky-300/25 bg-black/55 px-2 py-1 text-sm text-sky-50"
                            placeholder="Slot name"
                          />
                          <select value={slot.language} onChange={(event) => updateSlot(slot.slotId, { language: event.target.value })} className="mt-2 w-full rounded-lg border border-sky-300/25 bg-black/55 px-2 py-1 text-sm text-sky-50">
                            {slotLanguages.map((language) => (
                              <option key={language} value={language}>{language.toUpperCase()}</option>
                            ))}
                          </select>
                          <div className="mt-2 flex gap-2">
                            <NeonButton className="px-3 py-1 text-xs" onClick={() => updateSlot(slot.slotId, { name: (slotDraftNames[slot.slotId] ?? slot.name ?? "").trim() })}>Save</NeonButton>
                            <NeonButton className="px-3 py-1 text-xs" onClick={() => startSelectedSlot(slot.slotId)}>Start</NeonButton>
                            <NeonButton className="border-slate-700/70 bg-slate-950/55 px-3 py-1 text-xs text-sky-200 hover:bg-slate-900/70" onClick={() => stopSelectedSlot(slot.slotId)}>Stop</NeonButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-sky-300/15 bg-black/35 p-3 text-sm text-slate-300">
                    <p className="text-sky-100">Classic language chooser enabled</p>
                    <p className="mt-2">Available to users: {classicLanguages.map((language) => language.toUpperCase()).join(" / ")}</p>
                    <p className="mt-1 text-xs text-slate-400">Slots are ignored in this mode. Users pick their own language on the game screen.</p>
                    {slotError ? <p className="mt-2 text-sm text-rose-300">{slotError}</p> : null}
                  </div>
                )}
              </GlassCard>

              <GlassCard className="min-h-0 overflow-y-auto">
                <LeaderboardPanel />
              </GlassCard>
            </div>
          </>
        ) : null}

        {activeTab === "participants" ? (
          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.5fr_1fr]">
            <GlassCard className="min-h-0 overflow-auto">
              <h2 className="font-display text-2xl text-sky-100">Participants</h2>
              <table className="mt-4 w-full min-w-[900px] text-sm">
                <thead className="text-left text-sky-300">
                  <tr>
                    <th>Name</th>
                    <th>Roll</th>
                    <th>Slot</th>
                    <th>Language</th>
                    <th>Total Score</th>
                    <th>Questions</th>
                    <th>Total Correct</th>
                    <th>Time</th>
                    <th>Tab Switches</th>
                    <th>Fullscreen Exits</th>
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
                      <td>{p.slotName || String(p.slotId || "").toUpperCase()}</td>
                      <td>{p.selectedLanguage}</td>
                      <td>{p.scoreBreakdown?.finalScore || 0}</td>
                      <td>{p.totalQuestionsAttempted || 0}</td>
                      <td>{p.totalCorrect || 0}</td>
                      <td>{p.timeTaken || 0}s</td>
                      <td>{p.tabSwitchCount || 0}</td>
                      <td>{p.fullscreenExitCount || 0}</td>
                      <td>{p.copyAttemptCount || 0}</td>
                      <td>{p.pasteAttemptCount || 0}</td>
                      <td>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>

            <GlassCard className="min-h-0 overflow-y-auto space-y-3">
              <h2 className="font-display text-2xl text-sky-100">Participant Detail</h2>
              {!detail ? <p className="text-sm text-slate-300">Select a participant to inspect code and reports.</p> : null}
              {detail ? (
                <div className="space-y-2 text-sm text-slate-300">
                  <p><strong>Name:</strong> {detail.name}</p>
                  <p><strong>Roll:</strong> {detail.rollNumber}</p>
                  <p><strong>Slot:</strong> {detail.slotName || String(detail.slotId || "").toUpperCase()}</p>
                  <p><strong>Question:</strong> {detail.assignedQuestion?.title}</p>
                  <p><strong>Total score:</strong> {detail.scoreBreakdown?.finalScore || 0}</p>
                  <p><strong>Tests:</strong> {detail.testReport?.passed || 0}/{detail.testReport?.total || 0}</p>
                  <p><strong>Tab switches:</strong> {detail.tabSwitchCount || 0}</p>
                  <p><strong>Fullscreen exits:</strong> {detail.fullscreenExitCount || 0}</p>
                  <p><strong>Copy attempts:</strong> {detail.copyAttemptCount || 0}</p>
                  <p><strong>Paste attempts:</strong> {detail.pasteAttemptCount || 0}</p>
                  <pre className="max-h-44 overflow-auto rounded-xl border border-sky-300/20 bg-black/45 p-2 text-xs text-sky-100">{detail.code}</pre>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <select value={exportSlotId} onChange={(event) => setExportSlotId(event.target.value)} className="rounded-lg border border-sky-300/25 bg-black/55 px-2 py-1 text-sm text-sky-50">
                  <option value="">All Slots</option>
                  {slots.map((slot) => (
                    <option key={slot.slotId} value={slot.slotId}>{slot.slotId.toUpperCase()}</option>
                  ))}
                </select>
                <NeonButton className="border-sky-700/50 bg-sky-900/20 text-sky-100 hover:bg-sky-900/35" onClick={exportCsv}>Export CSV</NeonButton>
              </div>
            </GlassCard>
          </div>
        ) : null}

        {activeTab === "questions" ? (
          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.4fr_auto]">
            <GlassCard className="min-h-0 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl text-sky-100">Questions</h2>
                <div className="flex gap-2">
                  <NeonButton onClick={() => setShowQuestionModal(true)}>Add Question</NeonButton>
                  <NeonButton className="border-slate-700/70 bg-slate-950/55 text-sky-200 hover:bg-slate-900/70" onClick={resetGame}>Reset Game</NeonButton>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {questions.map((question) => (
                  <div key={question._id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm">
                    <span>{question.qid}. {question.title} • {question.difficulty} • {question.category}</span>
                    <NeonButton className="px-3 py-1 text-xs" onClick={() => deleteQuestion(question._id)}>Delete</NeonButton>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="w-[260px]">
              <p className="text-sm text-slate-300">Use Add Question popup for cleaner editing.</p>
            </GlassCard>
          </div>
        ) : null}
      </div>

      {showQuestionModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowQuestionModal(false)}>
          <div className="w-full max-w-3xl rounded-3xl border border-sky-300/35 bg-slate-950/95 p-6 shadow-[0_0_60px_rgba(37,99,235,0.35)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-sky-100">Add Question</h2>
              <NeonButton className="px-3 py-1 text-xs" onClick={() => setShowQuestionModal(false)}>Close</NeonButton>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input placeholder="Title" value={editor.title} onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))} className="rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2" />
              <select value={editor.difficulty} onChange={(e) => setEditor((prev) => ({ ...prev, difficulty: e.target.value }))} className="rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2">
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
              <input placeholder="Category" value={editor.category} onChange={(e) => setEditor((prev) => ({ ...prev, category: e.target.value }))} className="rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2" />
              <input placeholder="Hint" value={editor.hint} onChange={(e) => setEditor((prev) => ({ ...prev, hint: e.target.value }))} className="rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2" />
              <input type="number" min="30" max="7200" placeholder="Expected time (seconds)" value={editor.expectedTimeSeconds} onChange={(e) => setEditor((prev) => ({ ...prev, expectedTimeSeconds: e.target.value }))} className="rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2" />
            </div>

            <textarea placeholder="Python code" value={editor.pythonCode} onChange={(e) => setEditor((prev) => ({ ...prev, pythonCode: e.target.value }))} className="mt-3 h-32 w-full rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2" />
            <textarea placeholder="Test cases JSON" value={editor.testCasesText} onChange={(e) => setEditor((prev) => ({ ...prev, testCasesText: e.target.value }))} className="mt-3 h-36 w-full rounded-xl border border-sky-300/25 bg-black/45 px-3 py-2 font-mono text-xs" />
            {editorError ? <p className="mt-2 text-sm text-rose-300">{editorError}</p> : null}

            <div className="mt-3 flex gap-2">
              <NeonButton onClick={async () => { await createQuestion(); setShowQuestionModal(false); }}>Create</NeonButton>
            </div>
          </div>
        </div>
      ) : null}
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
