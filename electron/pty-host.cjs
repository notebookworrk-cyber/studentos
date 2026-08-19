// PTY host child process — runs under plain Node so node-pty's native binary
// matches the ABI. Speak line-delimited JSON over stdio with the Electron main.
const pty = require("node-pty");

const tabs = new Map();

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function spawnTab(id, opts) {
  const shell = detectShell();
  const p = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: opts.cols || 80,
    rows: opts.rows || 24,
    cwd: opts.cwd || process.env.USERPROFILE || process.env.HOME || ".",
    env: { ...process.env, TERM: "xterm-256color", COLORTERM: "truecolor" },
    encoding: "utf8",
  });
  tabs.set(id, { p, name: opts.name || `Terminal ${id.slice(0, 4)}`, opts });
  p.onData((data) => send({ t: "data", id, data }));
  p.onExit(({ exitCode }) => {
    tabs.delete(id);
    send({ t: "exit", id, exitCode });
  });
}

function detectShell() {
  if (process.platform === "win32") {
    const pwsh7 = process.env.ProgramW6432
      ? require("path").join(process.env.ProgramW6432, "PowerShell", "7", "pwsh.exe")
      : "";
    const pwsh = process.env.SystemRoot
      ? require("path").join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
      : "";
    return require("fs").existsSync(pwsh7)
      ? pwsh7
      : require("fs").existsSync(pwsh)
        ? pwsh
        : process.env.ComSpec || "cmd.exe";
  }
  return process.env.SHELL || "/bin/bash";
}

process.stdin.setEncoding("utf8");
let buf = "";
process.stdin.on("data", (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i);
    buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue; // ponytail: ignore malformed lines
    }
    const { t, id, opts } = msg;
    switch (t) {
      case "create":
        if (tabs.has(id)) break;
        spawnTab(id, opts || {});
        send({ t: "created", id, name: tabs.get(id).name });
        break;
      case "write": {
        const tab = tabs.get(id);
        if (tab) tab.p.write(msg.data);
        break;
      }
      case "resize": {
        const tab = tabs.get(id);
        if (tab) tab.p.resize(msg.cols, msg.rows);
        break;
      }
      case "kill": {
        const tab = tabs.get(id);
        if (tab) tab.p.kill();
        break;
      }
      case "rename": {
        const tab = tabs.get(id);
        if (tab) tab.name = msg.name;
        break;
      }
      case "restart": {
        const old = tabs.get(id);
        if (old) {
          old.p.kill();
          tabs.delete(id);
        }
        spawnTab(id, (old && old.opts) || opts || {});
        send({ t: "created", id, name: tabs.get(id).name });
        break;
      }
    }
  }
});