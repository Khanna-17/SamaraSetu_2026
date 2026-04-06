import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Howl } from "howler";
import api from "../lib/api";
import ParticleBackground from "../components/ParticleBackground";
import GlassCard from "../components/GlassCard";
import NeonButton from "../components/NeonButton";
import TimerBar from "../components/TimerBar";

const cheers = ["You are on fire", "Compiler fears you", "Edge cases fear your vibe"];

const languageOptions = [
  { label: "C", value: "c", monaco: "c" },
  { label: "C++", value: "cpp", monaco: "cpp" },
  { label: "Java", value: "java", monaco: "java" },
  { label: "JavaScript", value: "javascript", monaco: "javascript" }
];

const clickSound = new Howl({
  src: ["https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"],
  volume: 0.2
});

export default function GamePage() {
  const [session, setSession] = useState(null);
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [guardMessage, setGuardMessage] = useState("");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [copyAttemptCount, setCopyAttemptCount] = useState(0);
  const [pasteAttemptCount, setPasteAttemptCount] = useState(0);
  const navigate = useNavigate();
  const autosaveRef = useRef({ selectedLanguage: "javascript", code: "", elapsed: 0 });

  const randomCheer = useMemo(() => cheers[Math.floor(Math.random() * cheers.length)], []);

  useEffect(() => {
    async function load() {
      const { data } = await api.get("/game/session");
      setSession(data.session);
      setCode(data.session.code || "");
      setSelectedLanguage(data.session.selectedLanguage || "javascript");
      setTabSwitchCount(data.session.tabSwitchCount || 0);
      setCopyAttemptCount(data.session.copyAttemptCount || 0);
      setPasteAttemptCount(data.session.pasteAttemptCount || 0);
      if (data.session.startedAt) {
        const sec = Math.max(0, Math.floor((Date.now() - new Date(data.session.startedAt).getTime()) / 1000));
        setElapsed(sec);
      }

      if (data.session.status === "submitted") {
        localStorage.setItem("arena_result", JSON.stringify({
          scoreBreakdown: data.session.scoreBreakdown,
          testReport: data.session.testReport,
          aiEvaluation: data.session.aiEvaluation,
          attemptSummary: data.session.attemptSummary,
          tabSwitchCount: data.session.tabSwitchCount || 0,
          copyAttemptCount: data.session.copyAttemptCount || 0,
          pasteAttemptCount: data.session.pasteAttemptCount || 0
        }));
        navigate("/result", { replace: true });
      }
    }

    load().catch(() => {
      localStorage.removeItem("arena_user_token");
      navigate("/");
    });
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    autosaveRef.current = { selectedLanguage, code, elapsed };
  }, [selectedLanguage, code, elapsed]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        setSaving(true);
        const latest = autosaveRef.current;
        await api.post("/game/autosave", {
          selectedLanguage: latest.selectedLanguage,
          code: latest.code,
          timeTaken: latest.elapsed
        });
      } finally {
        setSaving(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    function showGuardMessage(message) {
      setGuardMessage(message);
      window.clearTimeout(showGuardMessage.timeoutId);
      showGuardMessage.timeoutId = window.setTimeout(() => {
        setGuardMessage("");
      }, 2200);
    }

    function handleKeyDown(event) {
      const key = event.key.toLowerCase();
      const isClipboardShortcut =
        (event.ctrlKey || event.metaKey) && ["c", "v", "x", "a"].includes(key);

      if (isClipboardShortcut) {
        event.preventDefault();
        showGuardMessage("Clipboard shortcuts are disabled during the challenge.");
      }
    }

    function handleClipboardEvent(event) {
      event.preventDefault();
      const actionType = event.type === "paste" ? "paste" : "copy";

      api.post("/game/clipboard-attempt", { type: actionType }).then(({ data }) => {
        setCopyAttemptCount(data.copyAttemptCount || 0);
        setPasteAttemptCount(data.pasteAttemptCount || 0);
      }).catch(() => {});

      showGuardMessage("Copy, cut, and paste are disabled during the challenge.");
    }

    function handleContextMenu(event) {
      event.preventDefault();
      showGuardMessage("Right-click actions are disabled during the challenge.");
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleClipboardEvent);
    document.addEventListener("cut", handleClipboardEvent);
    document.addEventListener("paste", handleClipboardEvent);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleClipboardEvent);
      document.removeEventListener("cut", handleClipboardEvent);
      document.removeEventListener("paste", handleClipboardEvent);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.clearTimeout(showGuardMessage.timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    let locked = false;
    let timeoutId;

    async function handleVisibilityChange() {
      if (document.visibilityState !== "hidden" || locked) {
        return;
      }

      locked = true;
      try {
        const { data } = await api.post("/game/tab-switch");
        setTabSwitchCount(data.tabSwitchCount || 0);
        setGuardMessage(`Tab switches detected: ${data.tabSwitchCount || 0}`);
      } catch {
        setGuardMessage("Tab switch was detected.");
      } finally {
        timeoutId = window.setTimeout(() => {
          locked = false;
        }, 800);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearTimeout(timeoutId);
    };
  }, [session]);

  async function submitCode() {
    clickSound.play();
    setSubmitting(true);
    setError("");

    try {
      const { data } = await api.post("/game/submit", {
        selectedLanguage,
        code,
        timeTaken: elapsed
      });

      localStorage.setItem("arena_result", JSON.stringify(data));
      navigate("/result");
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!session) {
    return <main className="grid min-h-screen place-items-center bg-black text-amber-100">Loading mission...</main>;
  }

  const monacoLanguage = languageOptions.find((x) => x.value === selectedLanguage)?.monaco || "javascript";

  return (
    <main className="relative min-h-screen select-none bg-black px-4 py-4 text-amber-50">
      <ParticleBackground />
      <div className="relative mx-auto flex max-w-[1400px] flex-col gap-4">
        <GlassCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400">{session.question.difficulty} challenge</p>
              <h1 className="font-display text-2xl text-amber-100">{session.question.title}</h1>
              <p className="text-sm text-slate-300">Hint: {session.question.hint}</p>
            </div>
            <p className="rounded-xl border border-red-800/40 bg-red-900/18 px-3 py-2 text-sm text-amber-100">{randomCheer}</p>
          </div>
          <TimerBar elapsed={elapsed} expectedSeconds={session.question.expectedTimeSeconds} />
        </GlassCard>

        <div className="grid min-h-[62vh] gap-4 lg:grid-cols-2">
          <GlassCard className="flex min-h-[300px] flex-col">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-amber-400">Python Source (Read-only)</div>
            <div className="flex-1 overflow-hidden rounded-2xl border border-amber-300/18 [user-select:none] [&_*]:select-none">
              <Editor
                theme="vs-dark"
                language="python"
                value={session.question.pythonCode}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
              />
            </div>
          </GlassCard>

          <GlassCard className="flex min-h-[300px] flex-col">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-amber-400">Your Translation</div>
              <select
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="rounded-lg border border-amber-300/25 bg-black/55 px-2 py-1 text-sm text-amber-50"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 overflow-hidden rounded-2xl border border-red-900/35">
              <Editor
                theme="vs-dark"
                language={monacoLanguage}
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{ minimap: { enabled: false }, fontSize: 14, selectionClipboard: false }}
              />
            </div>
          </GlassCard>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3">
          <NeonButton onClick={submitCode} disabled={submitting}>{submitting ? "Evaluating..." : "Submit Translation"}</NeonButton>
          <span className="text-sm text-slate-300">Auto-save: {saving ? "syncing..." : "active"}</span>
          <span className="text-sm text-slate-300">Tab switches: {tabSwitchCount}</span>
          <span className="text-sm text-slate-300">Copy attempts: {copyAttemptCount}</span>
          <span className="text-sm text-slate-300">Paste attempts: {pasteAttemptCount}</span>
          {guardMessage ? <span className="text-sm text-red-300">{guardMessage}</span> : null}
          {error ? <span className="text-sm text-rose-300">{error}</span> : null}
        </motion.div>
      </div>
    </main>
  );
}
