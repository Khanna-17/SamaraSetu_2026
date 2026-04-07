import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Howl } from "howler";
import api from "../lib/api";
import socket from "../lib/socket";
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

const boilerplates = {
  c: `#include <stdio.h>

int main(void) {
    
    return 0;
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    
    return 0;
}
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        
    }
}
`,
  javascript: `function solve() {
    
}

solve();
`
};

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
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [guardMessage, setGuardMessage] = useState("");
  const [runInput, setRunInput] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [runNotes, setRunNotes] = useState("");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [copyAttemptCount, setCopyAttemptCount] = useState(0);
  const [pasteAttemptCount, setPasteAttemptCount] = useState(0);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [contestState, setContestState] = useState({ mode: "live", message: "Contest is live." });
  const [fullscreenActive, setFullscreenActive] = useState(Boolean(document.fullscreenElement));
  const navigate = useNavigate();
  const autosaveRef = useRef({ selectedLanguage: "javascript", code: "", elapsed: 0 });
  const hasAutoFullscreenAttemptedRef = useRef(false);

  const randomCheer = useMemo(() => cheers[Math.floor(Math.random() * cheers.length)], []);

  useEffect(() => {
    async function load() {
      const { data } = await api.get("/game/session");
      setSession(data.session);
      setCode(data.session.code || boilerplates[data.session.selectedLanguage || "javascript"] || "");
      setSelectedLanguage(data.session.selectedLanguage || "javascript");
      setTabSwitchCount(data.session.tabSwitchCount || 0);
      setCopyAttemptCount(data.session.copyAttemptCount || 0);
      setPasteAttemptCount(data.session.pasteAttemptCount || 0);
      setAttemptHistory(data.session.attemptHistory || []);
      setContestState(data.session.contestState || { mode: "live", message: "Contest is live." });
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
          attemptHistory: data.session.attemptHistory || [],
          contestState: data.session.contestState || { mode: "live", message: "Contest is live." },
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
    socket.connect();
    const onContestStateUpdated = (nextState) => {
      setContestState(nextState);
      if (nextState?.mode !== "live") {
        setGuardMessage(nextState?.message || "Contest access has changed.");
      }
    };

    socket.on("contest-state-updated", onContestStateUpdated);
    return () => {
      socket.off("contest-state-updated", onContestStateUpdated);
    };
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      const active = Boolean(document.fullscreenElement);
      setFullscreenActive(active);
      if (!active && session) {
        setGuardMessage("Fullscreen exited. Re-enter exam mode to continue distraction-free.");
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [session]);

  useEffect(() => {
    if (!session || hasAutoFullscreenAttemptedRef.current) {
      return;
    }

    hasAutoFullscreenAttemptedRef.current = true;
    toggleFullscreen(true);
  }, [session]);

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

    const preferredBoilerplate = boilerplates[selectedLanguage] || "";
    const previousBoilerplate = boilerplates[session.selectedLanguage] || "";
    const isUsingPreviousBoilerplate = !code.trim() || code === previousBoilerplate;

    if (isUsingPreviousBoilerplate && preferredBoilerplate && selectedLanguage !== session.selectedLanguage) {
      setCode(preferredBoilerplate);
    }
  }, [selectedLanguage, session, code]);

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
      const isClipboardShortcut = (event.ctrlKey || event.metaKey) && ["c", "v", "x", "a"].includes(key);

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
      if (contestState.mode !== "live") {
        throw new Error(contestState.message || "Contest is not live. Submission is disabled.");
      }

      const { data } = await api.post("/game/submit", {
        selectedLanguage,
        code,
        timeTaken: elapsed
      });

      localStorage.setItem("arena_result", JSON.stringify(data));
      navigate("/result");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function runCode() {
    setRunning(true);
    setError("");
    setRunOutput("");
    setRunNotes("");

    try {
      const { data } = await api.post("/game/run", {
        selectedLanguage,
        code,
        stdin: runInput
      });
      setRunOutput(data.output || "");
      setRunNotes(data.notes || "");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Run failed");
    } finally {
      setRunning(false);
    }
  }

  async function toggleFullscreen(silent = false) {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      if (!silent) {
        setGuardMessage("Fullscreen mode is unavailable in this browser.");
      }
    }
  }

  if (!session) {
    return <main className="grid min-h-screen place-items-center bg-black text-sky-100">Loading mission...</main>;
  }

  const monacoLanguage = languageOptions.find((x) => x.value === selectedLanguage)?.monaco || "javascript";
  const editingLocked = contestState.mode !== "live";

  return (
    <main className="relative min-h-screen select-none bg-black px-4 py-6 text-sky-50">
      <ParticleBackground />
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-6">
        <GlassCard className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{session.question.difficulty} challenge | {session.question.category || "logic"}</p>
              <h1 className="mt-2 font-display text-3xl text-slate-50">{session.question.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Hint: {session.question.hint}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NeonButton className="px-3 py-2 text-sm" onClick={toggleFullscreen}>
                {fullscreenActive ? "Exit Exam Mode" : "Enter Exam Mode"}
              </NeonButton>
              <p className="rounded-2xl border border-slate-700/60 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">{randomCheer}</p>
            </div>
          </div>
          <TimerBar elapsed={elapsed} expectedSeconds={session.question.expectedTimeSeconds} />
          <div className="flex flex-wrap gap-3">
            <StatusChip label="Contest" value={contestState.mode} accent={contestState.mode === "live"} />
            <StatusChip label="Expected time" value={`${session.question.expectedTimeSeconds}s`} />
            <StatusChip label="Scoring" value="Tests only" />
            <StatusChip label="Autosave" value={saving ? "syncing" : "active"} accent={!saving} />
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm ${editingLocked ? "border-slate-700/70 bg-slate-950/80 text-slate-300" : "border-sky-300/12 bg-slate-950/70 text-slate-200"}`}>
            {contestState.message || "Contest is live."}
          </div>
          <div className="flex flex-wrap gap-3 border-t border-slate-800/80 pt-2">
            <NeonButton className="bg-cyan-300/16 text-cyan-50 hover:bg-cyan-300/22" onClick={runCode} disabled={running || editingLocked}>
              {running ? "Running..." : "Run"}
            </NeonButton>
            <NeonButton className="bg-cyan-400/18 text-cyan-50 hover:bg-cyan-400/24" onClick={submitCode} disabled={submitting || editingLocked}>
              {submitting ? "Evaluating..." : "Submit Translation"}
            </NeonButton>
            <div className="ml-auto flex flex-wrap gap-2 text-xs">
              <QuietPill label="Tabs" value={tabSwitchCount} />
              <QuietPill label="Copy" value={copyAttemptCount} />
              <QuietPill label="Paste" value={pasteAttemptCount} />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-2xl text-slate-50">Question Brief</h3>
            <p className="text-sm text-slate-400">Translate the Python source into {languageOptions.find((option) => option.value === selectedLanguage)?.label || "your selected language"} with identical behavior.</p>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/68 p-5 text-sm text-slate-300">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Mission</p>
              <p className="mt-3 leading-6">Translate the Python source exactly into {languageOptions.find((option) => option.value === selectedLanguage)?.label || "your selected language"}.</p>
              <p className="mt-2 leading-6">Preserve the same input and output behavior, including empty input, edge cases, and output formatting.</p>
            </div>
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/68 p-5 text-sm text-slate-300">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Checklist</p>
              <ul className="mt-2 space-y-1.5">
                <li>Match the source program logic closely.</li>
                <li>Print only the final expected output.</li>
                <li>Check how empty input or single values behave.</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/68 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Run With Custom Input</p>
              <textarea
                value={runInput}
                onChange={(event) => setRunInput(event.target.value)}
                className="mt-3 h-32 w-full rounded-2xl border border-slate-800 bg-black/45 px-3 py-3 font-mono text-sm text-sky-50 outline-none"
                placeholder="Enter stdin here exactly as the program should receive it"
              />
              <p className="mt-3 text-xs text-slate-500">Use this to preview output before final submission.</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/68 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Run Output</p>
              <pre className="mt-3 min-h-[128px] whitespace-pre-wrap break-words rounded-2xl border border-slate-800 bg-black/55 p-4 font-mono text-sm text-slate-200">{runOutput || "[no output yet]"}</pre>
              {runNotes ? <p className="mt-3 text-xs leading-5 text-slate-400">{runNotes}</p> : null}
            </div>
            <div className="rounded-3xl border border-slate-800/80 bg-slate-950/68 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Integrity Signals</p>
              <div className="mt-4 grid gap-3">
                <SignalRow label="Tab switches" value={tabSwitchCount} />
                <SignalRow label="Copy attempts" value={copyAttemptCount} />
                <SignalRow label="Paste attempts" value={pasteAttemptCount} />
                {guardMessage ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/8 px-3 py-2 text-xs text-rose-200">{guardMessage}</p> : null}
                {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/8 px-3 py-2 text-xs text-rose-200">{error}</p> : null}
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid min-h-[62vh] gap-6 lg:grid-cols-2">
          <GlassCard className="flex min-h-[320px] flex-col">
            <div className="mb-4 text-xs uppercase tracking-[0.2em] text-cyan-300">Python Source (Read-only)</div>
            <div className="flex-1 overflow-hidden rounded-[24px] border border-slate-800 [user-select:none] [&_*]:select-none">
              <Editor
                theme="vs-dark"
                language="python"
                value={session.question.pythonCode}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
              />
            </div>
          </GlassCard>

          <GlassCard className="flex min-h-[320px] flex-col">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Your Translation</div>
              <select
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="rounded-xl border border-slate-700 bg-black/55 px-3 py-2 text-sm text-sky-50"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 overflow-hidden rounded-[24px] border border-slate-800">
              <Editor
                theme="vs-dark"
                language={monacoLanguage}
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{ minimap: { enabled: false }, fontSize: 14, selectionClipboard: false, readOnly: editingLocked }}
              />
            </div>
            <p className="mt-4 text-xs text-slate-500">Expected time: {session.question.expectedTimeSeconds}s | Final score uses testcase pass percentage only.</p>
          </GlassCard>
        </div>

        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-xl text-slate-50">Attempt History</h3>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Previous submissions</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {attemptHistory.length ? attemptHistory.map((attempt) => (
              <motion.div key={attempt.sessionId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-800/90 bg-slate-950/68 p-4 text-sm text-slate-300">
                <p className="text-slate-100">Attempt {attempt.attemptNumber}: {attempt.questionTitle}</p>
                <p className="mt-2 text-slate-400">{attempt.difficulty} | {attempt.category}</p>
                <p className="mt-2 text-cyan-200">{attempt.passed}/{attempt.total} tests | Score {attempt.finalScore}</p>
              </motion.div>
            )) : <p className="text-sm text-slate-500">No completed attempts yet.</p>}
          </div>
        </GlassCard>
      </div>
    </main>
  );
}

function StatusChip({ label, value, accent = false }) {
  return (
    <div className={`rounded-2xl border px-3 py-2 text-sm ${accent ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-slate-700/70 bg-slate-950/75 text-slate-300"}`}>
      <span className="text-slate-500">{label}: </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function QuietPill({ label, value }) {
  return (
    <span className="rounded-full border border-slate-700/70 bg-slate-950/72 px-3 py-2 text-slate-300">
      {label}: {value}
    </span>
  );
}

function SignalRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-black/35 px-3 py-3 text-sm text-slate-300">
      <span>{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}
