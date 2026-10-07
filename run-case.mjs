import { spawn } from "node:child_process";
import { open, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

const root = dirname(new URL(import.meta.url).pathname);
const appNodeModules = resolve(root, "app/node_modules");
const caseName = process.argv[2];

if (caseName !== "versionless" && caseName !== "versioned") {
  throw new Error("usage: node run-case.mjs versionless|versioned");
}

const dependencyManifest = {
  name: "@repro/versionless",
  private: true,
  type: "module",
  exports: { ".": "./src/index.ts" },
  ...(caseName === "versioned" ? { version: "0.0.0" } : {}),
};

await writeFile(
  resolve(root, "packages/versionless/package.json"),
  `${JSON.stringify(dependencyManifest, null, 2)}\n`,
);
await rm(resolve(root, "app/.mastra"), { recursive: true, force: true });
const log = await open(resolve(root, `${caseName}.log`), "w");
const child = spawn(resolve(appNodeModules, ".bin/mastra"), ["dev", "--dir", "src/mastra"], {
  cwd: resolve(root, "app"),
  detached: true,
  env: { ...process.env, PORT: caseName === "versionless" ? "4191" : "4192" },
  stdio: ["ignore", log.fd, log.fd],
});
let exited = false;
let exitCode = null;
child.on("exit", (code) => {
  exited = true;
  exitCode = code;
});

const deadline = Date.now() + 20_000;
let outcome = "timeout";
while (Date.now() < deadline) {
  if (exited) {
    outcome = `exit:${exitCode}`;
    break;
  }
  try {
    const response = await fetch(`http://127.0.0.1:${caseName === "versionless" ? "4191" : "4192"}/api/agents`);
    if (response.ok) {
      outcome = `ready:${response.status}`;
      break;
    }
  } catch {}
  await new Promise((resolveWait) => setTimeout(resolveWait, 250));
}

if (!exited) {
  process.kill(-child.pid, "SIGTERM");
  await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  try { process.kill(-child.pid, "SIGKILL"); } catch {}
}
await log.close();
console.log(`${caseName}: ${outcome}`);
