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
  { label: "Go", value: "go", monaco: "go" },
  { label: "Rust", value: "rust", monaco: "rust" },
  { label: "Kotlin", value: "kotlin", monaco: "kotlin" }
];

const cheatSheets = {
  go: {
    title: "Go Contest Cheat Sheet",
    blocks: [
      {
        heading: "Fast Input and Output",
        items: [
          "Use reader: in := bufio.NewReader(os.Stdin)",
          "Read ints: fmt.Fscan(in, &n)",
          "Buffered output: out := bufio.NewWriter(os.Stdout); defer out.Flush()",
          "Print answer: fmt.Fprintln(out, ans)"
        ]
      },
      {
        heading: "Slices, Maps, and Loops",
        items: [
          "Slice init: arr := make([]int, n)",
          "Append: arr = append(arr, x)",
          "Map counter: freq := map[int]int{}; freq[x]++",
          "Loop index: for i := 0; i < n; i++ { ... }",
          "Loop values: for _, v := range arr { ... }"
        ]
      },
      {
        heading: "Common Patterns",
        items: [
          "Sort ints: sort.Ints(arr)",
          "Reverse in-place: for l, r := 0, len(arr)-1; l < r; l, r = l+1, r-1 { arr[l], arr[r] = arr[r], arr[l] }",
          "Abs: if x < 0 { x = -x }",
          "Min/Max: if a < b { ... } else { ... }"
        ]
      }
    ]
  },
  rust: {
    title: "Rust Contest Cheat Sheet",
    blocks: [
      {
        heading: "Fast Input and Parsing",
        items: [
          "Read all: io::stdin().read_to_string(&mut input).unwrap();",
          "Iterator parser: let mut it = input.split_whitespace();",
          "Next int: let n: i64 = it.next().unwrap().parse().unwrap();",
          "Output: println!(\"{}\", ans);"
        ]
      },
      {
        heading: "Vectors, HashMap, and Loops",
        items: [
          "Vector: let mut arr: Vec<i64> = Vec::new();",
          "Push: arr.push(x);",
          "HashMap: use std::collections::HashMap;",
          "Count: *freq.entry(x).or_insert(0) += 1;",
          "Loop index: for i in 0..n as usize { ... }",
          "Loop values: for &v in arr.iter() { ... }"
        ]
      },
      {
        heading: "Common Patterns",
        items: [
          "Sort ascending: arr.sort();",
          "Sort descending: arr.sort_by(|a, b| b.cmp(a));",
          "Reverse: arr.reverse();",
          "Safe min/max: let m = arr.iter().min().unwrap();"
        ]
      }
    ]
  },
  kotlin: {
    title: "Kotlin Contest Cheat Sheet",
    blocks: [
      {
        heading: "Input and Output",
        items: [
          "Simple input: val n = readLine()!!.trim().toInt()",
          "Token input: val tokens = readLine()!!.trim().split(\" \")",
          "Mapped ints: val arr = tokens.map { it.toInt() }",
          "Output: println(ans)"
        ]
      },
      {
        heading: "Collections and Loops",
        items: [
          "Mutable list: val arr = mutableListOf<Int>()",
          "Add item: arr.add(x)",
          "Count map: val freq = mutableMapOf<Int, Int>()",
          "Increment: freq[x] = (freq[x] ?: 0) + 1",
          "Loop index: for (i in 0 until n) { ... }",
          "Loop values: for (v in arr) { ... }"
        ]
      },
      {
        heading: "Common Patterns",
        items: [
          "Sort: val sorted = arr.sorted()",
          "Reverse: val rev = arr.reversed()",
          "String reverse: val r = s.reversed()",
          "Condition: if (x % 2 == 0) { ... } else { ... }"
        ]
      }
    ]
  }
};

const boilerplates = {
  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    in := bufio.NewReader(os.Stdin)
    _ = in
}
`,
  rust: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
}
`,
  kotlin: `fun main() {
    val line = readLine()
}
`
};

const clickSound = new Howl({
  src: ["https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"],
  volume: 0.2
});

export default function GamePage() {
  const [session, setSession] = useState(null);
  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("go");
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [runInput, setRunInput] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [runNotes, setRunNotes] = useState("");
  const [compileMessages, setCompileMessages] = useState([]);
  const [showConsolePopup, setShowConsolePopup] = useState(false);
  const [guardMessage, setGuardMessage] = useState("");
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [copyAttemptCount, setCopyAttemptCount] = useState(0);
  const [pasteAttemptCount, setPasteAttemptCount] = useState(0);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [contestState, setContestState] = useState({ mode: "live", message: "Contest is live." });
  const [fullscreenActive, setFullscreenActive] = useState(Boolean(document.fullscreenElement));
  const [fullscreenLockOpen, setFullscreenLockOpen] = useState(false);
  const navigate = useNavigate();
  const autosaveRef = useRef({ selectedLanguage: "go", code: "", elapsed: 0 });
  const hasAutoFullscreenAttemptedRef = useRef(false);
  const hadFullscreenRef = useRef(Boolean(document.fullscreenElement));
  const skipClipboardUntilRef = useRef({ copy: 0, paste: 0 });

  const randomCheer = useMemo(() => cheers[Math.floor(Math.random() * cheers.length)], []);

  useEffect(() => {
    async function load() {
      const { data } = await api.get("/game/session");
      setSession(data.session);
      setCode(data.session.code || boilerplates[data.session.selectedLanguage || "javascript"] || "");
      setSelectedLanguage(data.session.selectedLanguage || "javascript");
      setTabSwitchCount(data.session.tabSwitchCount || 0);
      setFullscreenExitCount(data.session.fullscreenExitCount || 0);
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
          fullscreenExitCount: data.session.fullscreenExitCount || 0,
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

      if (active) {
        hadFullscreenRef.current = true;
        setFullscreenLockOpen(false);
        return;
      }

      if (session && hadFullscreenRef.current) {
        setGuardMessage("Fullscreen exited. Re-enter fullscreen to continue.");
        setFullscreenLockOpen(true);

        api.post("/game/fullscreen-exit").then(({ data }) => {
          setFullscreenExitCount(data.fullscreenExitCount || 0);
        }).catch(() => {});
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
    const isUsingPreviousBoilerplate =
      !code.trim() || code === previousBoilerplate;

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
    function onEscape(event) {
      if (event.key === "Escape") {
        setShowCheatSheet(false);
        setShowConsolePopup(false);
      }
    }

    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  useEffect(() => {
    function showGuardMessage(message) {
      setGuardMessage(message);
      window.clearTimeout(showGuardMessage.timeoutId);
      showGuardMessage.timeoutId = window.setTimeout(() => {
        setGuardMessage("");
      }, 2200);
    }

    function registerClipboardAttempt(type) {
      api.post("/game/clipboard-attempt", { type }).then(({ data }) => {
        setCopyAttemptCount(data.copyAttemptCount || 0);
        setPasteAttemptCount(data.pasteAttemptCount || 0);
      }).catch(() => {});
    }

    function handleKeyDown(event) {
      const key = event.key.toLowerCase();
      const isClipboardShortcut =
        (event.ctrlKey || event.metaKey) && ["c", "v", "x", "a"].includes(key);

      if (isClipboardShortcut) {
        event.preventDefault();
        const type = key === "v" ? "paste" : "copy";
        skipClipboardUntilRef.current[type] = Date.now() + 450;
        registerClipboardAttempt(type);
        showGuardMessage("Clipboard shortcuts are disabled during the challenge.");
      }
    }

    function handleClipboardEvent(event) {
      event.preventDefault();
      const actionType = event.type === "paste" ? "paste" : "copy";

      if (Date.now() > (skipClipboardUntilRef.current[actionType] || 0)) {
        registerClipboardAttempt(actionType);
      }

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

  async function compileCode() {
    setError("");
    setCompiling(true);
    setShowConsolePopup(true);
    setCompileMessages([]);

    try {
      const { data } = await api.post("/game/compile", {
        selectedLanguage,
        code
      });

      const msgs = Array.isArray(data.messages) ? data.messages : [data.ok ? "Compile check passed." : "Compile check failed."];
      setCompileMessages(msgs);
    } catch (err) {
      setCompileMessages([err.response?.data?.message || err.message || "Compile failed"]);
    } finally {
      setCompiling(false);
    }
  }

  async function runCodePreview() {
    setError("");
    setRunning(true);
    setShowConsolePopup(true);
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
      setRunOutput("");
      setRunNotes(err.response?.data?.message || err.message || "Run failed");
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
  const sheet = cheatSheets[selectedLanguage] || { title: "Cheat Sheet", blocks: [] };
  const sampleTestCases = Array.isArray(session.question?.sampleTestCases)
    ? session.question.sampleTestCases.slice(0, 5)
    : [];

  return (
    <main className="relative h-[100dvh] overflow-hidden select-none bg-black px-3 py-3 text-sky-50">
      <ParticleBackground />
      <div className="relative mx-auto flex h-full max-w-[1500px] flex-col gap-3">
        <GlassCard className="space-y-3 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-400">{session.question.difficulty} challenge • {session.question.category || "logic"}</p>
              <h1 className="font-display text-2xl text-sky-100 xl:text-3xl">{session.question.title}</h1>
              <p className="mt-1 text-sm text-slate-300">Hint: {session.question.hint}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NeonButton className="px-3 py-2 text-sm" onClick={toggleFullscreen}>
                {fullscreenActive ? "Exit Exam Mode" : "Enter Exam Mode"}
              </NeonButton>
              <NeonButton onClick={submitCode} disabled={submitting || editingLocked}>{submitting ? "Evaluating..." : "Submit"}</NeonButton>
              <p className="rounded-xl border border-sky-800/40 bg-sky-900/18 px-3 py-2 text-sm text-sky-100">{randomCheer}</p>
            </div>
          </div>
          <TimerBar elapsed={elapsed} expectedSeconds={session.question.expectedTimeSeconds} />
          <p className={`rounded-xl border px-3 py-2 text-sm ${editingLocked ? "border-slate-700/60 bg-slate-900/60 text-sky-200" : "border-sky-300/20 bg-sky-100/5 text-sky-100"}`}>
            {contestState.message || "Contest is live."}
          </p>
        </GlassCard>

        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[380px_1fr]">
          <GlassCard className="min-h-0 overflow-hidden">
            <div className="flex h-full flex-col">
              <h3 className="font-display text-xl text-sky-100">Question Brief</h3>
              <div className="mt-3 space-y-3 overflow-y-auto pr-1 text-sm text-slate-300">
                <div className="rounded-2xl border border-sky-300/15 bg-black/35 p-4">
                  <p className="text-sky-100">What to do</p>
                  <p className="mt-2">Translate the Python source exactly into {languageOptions.find((option) => option.value === selectedLanguage)?.label || "your selected language"}.</p>
                  <p className="mt-2">Keep input and output behavior exactly the same, including edge cases.</p>
                  <p className="mt-2">Slot: {session.slotName || String(session.slotId || "").toUpperCase()} (language locked by admin).</p>
                </div>
                <div className="rounded-2xl border border-sky-300/15 bg-black/35 p-4">
                  <p className="text-sky-100">Submission Checklist</p>
                  <ul className="mt-2 space-y-1">
                    <li>Match loops and conditions from Python.</li>
                    <li>Do not print extra debug lines.</li>
                    <li>Handle empty input and single-value input safely.</li>
                    <li>Respect integer parsing and output format.</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-sky-300/15 bg-black/35 p-4">
                  <p className="text-sky-100">Sample Test Cases (5)</p>
                  <div className="mt-2 space-y-2">
                    {sampleTestCases.length ? sampleTestCases.map((testCase) => (
                      <div key={testCase.index} className="rounded-xl border border-sky-300/15 bg-black/35 p-2 text-xs">
                        <p className="text-sky-100">Case {testCase.index}</p>
                        <p className="mt-1 text-slate-300">Input</p>
                        <pre className="mt-1 overflow-auto rounded-lg border border-sky-900/35 bg-slate-950/50 p-2 text-slate-200">{String(testCase.stdin || "(empty)")}</pre>
                        <p className="mt-2 text-slate-300">Expected Output</p>
                        <pre className="mt-1 overflow-auto rounded-lg border border-sky-900/35 bg-slate-950/50 p-2 text-slate-200">{String(testCase.expectedOutput || "")}</pre>
                      </div>
                    )) : <p className="text-xs text-slate-400">No sample test cases available yet.</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-sky-300/15 bg-black/35 p-4">
                  <p className="text-sky-100">Attempt History</p>
                  <div className="mt-2 space-y-2">
                    {attemptHistory.length ? attemptHistory.map((attempt) => (
                      <div key={attempt.sessionId} className="rounded-xl border border-sky-300/15 bg-black/35 p-2 text-xs">
                        <p className="text-sky-100">Attempt {attempt.attemptNumber}: {attempt.questionTitle}</p>
                        <p>{attempt.difficulty} • {attempt.category}</p>
                        <p>{attempt.passed}/{attempt.total} tests • Score {attempt.finalScore}</p>
                      </div>
                    )) : <p className="text-xs text-slate-400">No completed attempts yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="grid min-h-0 gap-3 lg:grid-cols-2">
            <GlassCard className="flex min-h-0 flex-col">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-sky-400">Python Source (Read-only)</div>
            <div className="flex-1 overflow-hidden rounded-2xl border border-sky-300/18 [user-select:none] [&_*]:select-none">
              <Editor
                theme="vs-dark"
                language="python"
                value={session.question.pythonCode}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14 }}
              />
            </div>
            </GlassCard>

            <GlassCard className="flex min-h-0 flex-col">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-sky-400">Your Translation</div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-sky-300/25 bg-black/55 px-3 py-1 text-sm text-sky-50">
                  {languageOptions.find((option) => option.value === selectedLanguage)?.label || selectedLanguage}
                </span>
                <NeonButton className="px-3 py-1.5 text-xs" onClick={() => setShowCheatSheet(true)}>
                  Cheat Sheet
                </NeonButton>
                <NeonButton className="px-3 py-1.5 text-xs" onClick={runCodePreview} disabled={editingLocked || running}>
                  {running ? "Running..." : "Run"}
                </NeonButton>
                <NeonButton className="px-3 py-1.5 text-xs" onClick={compileCode} disabled={editingLocked || compiling}>
                  {compiling ? "Compiling..." : "Compile"}
                </NeonButton>
              </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-2xl border border-sky-900/35">
              <Editor
                theme="vs-dark"
                language={monacoLanguage}
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{ minimap: { enabled: false }, fontSize: 14, selectionClipboard: false, readOnly: editingLocked }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-400">Expected time: {session.question.expectedTimeSeconds}s • Final score uses testcase pass percentage only.</p>
            </GlassCard>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3 rounded-2xl border border-sky-300/20 bg-black/35 px-4 py-2">
          <span className="text-sm text-slate-300">Auto-save: {saving ? "syncing..." : "active"}</span>
          <span className="text-sm text-slate-300">Tab switches: {tabSwitchCount}</span>
          <span className="text-sm text-slate-300">Fullscreen exits: {fullscreenExitCount}</span>
          <span className="text-sm text-slate-300">Copy attempts: {copyAttemptCount}</span>
          <span className="text-sm text-slate-300">Paste attempts: {pasteAttemptCount}</span>
          {guardMessage ? <span className="text-sm text-red-300">{guardMessage}</span> : null}
          {error ? <span className="text-sm text-rose-300">{error}</span> : null}
        </motion.div>
      </div>

      {fullscreenLockOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-rose-300/40 bg-slate-950/95 p-7 text-center shadow-[0_0_70px_rgba(244,63,94,0.25)]">
            <p className="text-xs uppercase tracking-[0.25em] text-rose-300">Security Alert</p>
            <h2 className="mt-2 font-display text-4xl text-rose-100">Fullscreen Was Exited</h2>
            <p className="mt-4 text-lg text-slate-200">You must re-enter fullscreen to continue the challenge.</p>
            <p className="mt-2 text-sm text-slate-400">This warning will stay open until fullscreen mode is active again.</p>
            <div className="mt-6 flex items-center justify-center">
              <NeonButton className="border-rose-300/45 bg-rose-300/15 text-rose-100 hover:bg-rose-300/25" onClick={() => toggleFullscreen(false)}>
                Re-enter Fullscreen
              </NeonButton>
            </div>
          </div>
        </div>
      ) : null}

      {showCheatSheet ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowCheatSheet(false)}>
          <div
            className="w-full max-w-5xl rounded-3xl border border-sky-300/35 bg-slate-950/95 p-6 shadow-[0_0_60px_rgba(37,99,235,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-400">Language Helper</p>
                <h2 className="font-display text-3xl text-sky-100">{sheet.title}</h2>
              </div>
              <NeonButton className="px-3 py-2 text-sm" onClick={() => setShowCheatSheet(false)}>Close</NeonButton>
            </div>

            <div className="mt-5 grid max-h-[70vh] gap-3 overflow-y-auto pr-1 md:grid-cols-3">
              {sheet.blocks.map((block) => (
                <div key={block.heading} className="rounded-2xl border border-sky-300/20 bg-black/45 p-4">
                  <p className="text-base font-semibold text-sky-100">{block.heading}</p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
                    {block.items.map((item) => (
                      <li key={item} className="rounded-lg border border-sky-900/35 bg-slate-950/45 px-2 py-1">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showConsolePopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowConsolePopup(false)}>
          <div className="w-full max-w-4xl rounded-3xl border border-sky-300/35 bg-slate-950/95 p-6 shadow-[0_0_60px_rgba(37,99,235,0.35)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-sky-400">Code Check Console</p>
                <h2 className="font-display text-3xl text-sky-100">Run and Compile</h2>
              </div>
              <NeonButton className="px-3 py-2 text-sm" onClick={() => setShowConsolePopup(false)}>Close</NeonButton>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-sky-300/20 bg-black/45 p-4">
                <p className="text-sm font-semibold text-sky-100">Custom Input</p>
                <textarea
                  value={runInput}
                  onChange={(event) => setRunInput(event.target.value)}
                  className="mt-3 h-40 w-full rounded-xl border border-sky-300/25 bg-black/55 px-3 py-2 text-sm text-sky-50 outline-none"
                  placeholder="Enter input for run preview"
                />
                <div className="mt-3 flex gap-2">
                  <NeonButton className="px-3 py-1.5 text-xs" onClick={runCodePreview} disabled={editingLocked || running}>
                    {running ? "Running..." : "Run Preview"}
                  </NeonButton>
                  <NeonButton className="px-3 py-1.5 text-xs" onClick={compileCode} disabled={editingLocked || compiling}>
                    {compiling ? "Compiling..." : "Compile Check"}
                  </NeonButton>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-sky-300/20 bg-black/45 p-4">
                  <p className="text-sm font-semibold text-sky-100">Run Output</p>
                  <pre className="mt-3 max-h-36 overflow-auto rounded-lg border border-sky-900/35 bg-slate-950/50 p-2 text-xs text-slate-200">{runOutput || "No run output yet."}</pre>
                  <p className="mt-2 text-xs text-slate-400">{runNotes || "Run notes will appear here."}</p>
                </div>

                <div className="rounded-2xl border border-sky-300/20 bg-black/45 p-4">
                  <p className="text-sm font-semibold text-sky-100">Compile Messages</p>
                  <ul className="mt-3 max-h-36 space-y-2 overflow-auto text-xs text-slate-200">
                    {(compileMessages.length ? compileMessages : ["No compile check yet."]).map((msg, idx) => (
                      <li key={`${msg}-${idx}`} className="rounded-lg border border-sky-900/35 bg-slate-950/50 px-2 py-1">{msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
