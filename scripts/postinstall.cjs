const { spawn } = require("child_process");
const path = require("path");

function getNpmCommand() {
  const npmExecPath = process.env.npm_execpath;

  if (npmExecPath) {
    return {
      command: process.execPath,
      args: [npmExecPath, "install"]
    };
  }

  return {
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["install"]
  };
}

function runNpmInstall(targetDir) {
  return new Promise((resolve, reject) => {
    const { command, args } = getNpmCommand();
    const child = spawn(command, args, {
      cwd: path.resolve(__dirname, "..", targetDir),
      stdio: "inherit",
      env: process.env
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`npm install failed in ${targetDir} with exit code ${code}`));
    });
  });
}

async function main() {
  await runNpmInstall("backend");
  await runNpmInstall("frontend");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
