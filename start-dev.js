import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

console.log("\x1b[36m%s\x1b[0m", "=================================================");
console.log("\x1b[36m%s\x1b[0m", "       Students Hub — Starting Full Stack        ");
console.log("\x1b[36m%s\x1b[0m", "=================================================");
console.log("  Backend API:  http://localhost:5000/api");
console.log("  Frontend UI:  http://localhost:5173");
console.log("-------------------------------------------------");

const backend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(rootDir, "students-hub-backend"),
  stdio: "pipe",
  shell: true,
});

const frontend = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(rootDir, "students-hub-frontend"),
  stdio: "pipe",
  shell: true,
});

function pipeOutput(proc, prefix, color) {
  proc.stdout.on("data", (data) => {
    const lines = data.toString().split(/\r?\n/);
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${color}[${prefix}]\x1b[0m ${line}`);
      }
    }
  });

  proc.stderr.on("data", (data) => {
    const lines = data.toString().split(/\r?\n/);
    for (const line of lines) {
      if (line.trim()) {
        console.error(`${color}[${prefix}:err]\x1b[0m ${line}`);
      }
    }
  });
}

pipeOutput(backend, "backend", "\x1b[32m");
pipeOutput(frontend, "frontend", "\x1b[35m");

function cleanExit() {
  console.log("\nStopping Students Hub servers...");
  try {
    if (isWin) {
      if (backend.pid) spawn("taskkill", ["/pid", String(backend.pid), "/f", "/t"]);
      if (frontend.pid) spawn("taskkill", ["/pid", String(frontend.pid), "/f", "/t"]);
    } else {
      backend.kill("SIGINT");
      frontend.kill("SIGINT");
    }
  } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanExit);
process.on("SIGTERM", cleanExit);
