import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    args[key] = value;
  }
  return args;
}

function usage() {
  return [
    "用法: node export_pages.mjs --html <file.html> [--out <dir>] [--chrome <chrome path>] [--clean]",
    "",
    "参数:",
    "  --clean            导出前删除输出目录中已有的 page-*.png",
    "  --selector <css>   页面选择器。默认: .page:not(.measure)",
    "  --width <px>       浏览器视口宽度。默认: 1400",
    "  --height <px>      浏览器视口高度。默认: 1800",
    "  --scale <number>   设备缩放倍数。默认: 2",
    "  --wait <ms>        截图前等待时间。默认: 1200",
    "  --port <port>      调试端口。默认自动选择空闲端口",
  ].join("\n");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(file) {
  try {
    await access(file, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function chromeCandidates() {
  const home = os.homedir();
  if (process.platform === "win32") {
    const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
    const programFilesX86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";
    const localAppData = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
    return [
      path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
      path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
      "chrome.exe",
      "msedge.exe",
    ];
  }
  if (process.platform === "darwin") {
    return [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "google-chrome",
      "chromium",
      "chromium-browser",
      "microsoft-edge",
    ];
  }
  return [
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
    "microsoft-edge",
    "microsoft-edge-stable",
  ];
}

async function resolveChrome(explicit) {
  if (explicit) return explicit;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const candidates = chromeCandidates();
  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && await exists(candidate)) return candidate;
  }
  return candidates.find((candidate) => !path.isAbsolute(candidate));
}

function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

function waitForExit(processHandle, timeoutMs = 3000) {
  return new Promise((resolve) => {
    if (!processHandle || processHandle.exitCode !== null) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, timeoutMs);
    processHandle.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function rmWithRetry(target) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await rm(target, { recursive: true, force: true });
      return true;
    } catch (error) {
      if (!["EBUSY", "EPERM", "ENOTEMPTY"].includes(error.code) || attempt === 7) {
        console.warn(`警告：无法删除临时目录 ${target}: ${error.message}`);
        return false;
      }
      await sleep(400 + attempt * 300);
    }
  }
  return false;
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function waitForTab(port, getChromeError, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const chromeError = getChromeError();
    if (chromeError) throw chromeError;
    try {
      const tabs = await getJson(`http://127.0.0.1:${port}/json`);
      const tab = tabs.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
      if (tab) return tab;
    } catch {}
    await sleep(250);
  }
  throw new Error("浏览器调试接口未就绪。");
}

const args = parseArgs(process.argv.slice(2));
const htmlPath = args.html;

if (!htmlPath) {
  console.error(usage());
  process.exit(2);
}

const outDir = args.out || path.join(path.dirname(htmlPath), "pages");
const chromePath = await resolveChrome(args.chrome);
const selector = args.selector || ".page:not(.measure)";
const width = Number(args.width || 1400);
const height = Number(args.height || 1800);
const scale = Number(args.scale || 2);
const waitMs = Number(args.wait || 1200);
const port = args.port ? Number(args.port) : await findOpenPort();

await mkdir(outDir, { recursive: true });

if (args.clean) {
  const { readdir } = await import("node:fs/promises");
  const existingFiles = await readdir(outDir, { withFileTypes: true });
  await Promise.all(existingFiles
    .filter((entry) => entry.isFile() && /^page-\d+\.png$/i.test(entry.name))
    .map((entry) => rm(path.join(outDir, entry.name), { force: true })));
}

const userDataDir = path.join(os.tmpdir(), `letter-page-export-${Date.now()}`);
let chromeError = null;
let ws = null;
let chrome = null;

try {
  chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${width},${height}`,
    pathToFileURL(path.resolve(htmlPath)).href,
  ], { stdio: "ignore" });

  chrome.once("error", (error) => {
    chromeError = new Error(`无法启动 Chrome/Chromium (${chromePath})。请传入 --chrome <path> 或设置 CHROME_PATH。${error.message}`);
  });

  const tab = await waitForTab(port, () => chromeError);
  ws = new WebSocket(tab.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  });

  function cdp(method, params = {}) {
    const id = nextId++;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }

  await cdp("Page.enable");
  await cdp("Runtime.enable");
  await cdp("Page.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: false,
  });

  await sleep(waitMs);

  const metricsResult = await cdp("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const pages = Array.from(document.querySelectorAll(${JSON.stringify(selector)}));
      return pages.map((page, index) => {
        const rect = page.getBoundingClientRect();
        return {
          index: index + 1,
          x: rect.x + window.scrollX,
          y: rect.y + window.scrollY,
          width: rect.width,
          height: rect.height
        };
      });
    })()`,
  });

  const pages = metricsResult.result.value || [];
  if (!pages.length) throw new Error(`未找到匹配页面选择器的元素: ${selector}`);

  for (const page of pages) {
    const shot = await cdp("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: true,
      clip: {
        x: page.x,
        y: page.y,
        width: page.width,
        height: page.height,
        scale: 1,
      },
    });
    const file = path.join(outDir, `page-${String(page.index).padStart(2, "0")}.png`);
    await writeFile(file, Buffer.from(shot.data, "base64"));
    console.log(file);
  }
} finally {
  if (ws) ws.close();
  if (chrome) {
    chrome.kill();
    await waitForExit(chrome);
  }
  await rmWithRetry(userDataDir);
}
