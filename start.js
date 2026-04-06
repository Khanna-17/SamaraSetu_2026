const { spawn } = require("child_process");

const isRender = Boolean(process.env.RENDER);
const isProduction = process.env.NODE_ENV === "production";

const processes = [];

function run(command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  processes.push(child);

  child.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown(code);
    }
  });

  return child;
}

function shutdown(code = 0) {
  for (const proc of processes) {
    if (!proc.killed) {
      proc.kill();
    }
  }

  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

if (isRender || isProduction) {
  run("npm", ["run", "start", "--prefix", "server"]);
} else {
  run("npm", ["run", "dev", "--prefix", "server"]);
  run("npm", ["run", "dev", "--prefix", "client"]);
}
