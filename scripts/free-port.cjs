const { execSync } = require("child_process");

const rawPort = process.argv[2] || "5173";
const port = Number(rawPort);

if (!Number.isInteger(port) || port <= 0) {
  console.error(`Invalid port: ${rawPort}`);
  process.exit(1);
}

function killOnWindows(targetPort) {
  let output = "";
  try {
    output = execSync(`netstat -ano -p tcp | findstr :${targetPort}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
  } catch {
    return;
  }

  const pids = new Set();
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    const pid = parts[parts.length - 1];
    if (/^\d+$/.test(pid)) {
      pids.add(pid);
    }
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`Freed port ${targetPort} by killing PID ${pid}`);
    } catch {
      // Ignore processes that cannot be killed.
    }
  }
}

function killOnUnix(targetPort) {
  try {
    const pidOutput = execSync(`lsof -ti tcp:${targetPort}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();

    if (!pidOutput) return;

    const pids = [...new Set(pidOutput.split(/\s+/).filter(Boolean))];
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
        console.log(`Freed port ${targetPort} by killing PID ${pid}`);
      } catch {
        // Ignore processes that cannot be killed.
      }
    }
  } catch {
    // No listener or lsof unavailable.
  }
}

if (process.platform === "win32") {
  killOnWindows(port);
} else {
  killOnUnix(port);
}
