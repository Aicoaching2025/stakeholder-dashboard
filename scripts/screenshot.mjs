// Capture README screenshots of the dashboard with headless Chrome.
//
// Uses the system Chrome via puppeteer-core (no bundled browser download).
// Targets the live deployment by default; override with a URL argument or the
// SHOT_URL env var (e.g. http://localhost:5173 against `npm run dev`).
//
//   node scripts/screenshot.mjs [url]
//
// Writes:
//   docs/dashboard.png        above-the-fold hero (KPIs + leaderboard)
//   docs/dashboard-full.png   full-page capture
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DOCS = join(ROOT, "docs");

const URL = process.argv[2] || process.env.SHOT_URL || "https://stakeholder-dashboard-nine.vercel.app/";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe"),
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);

const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  console.error("Could not find Chrome/Edge. Set CHROME_PATH to the browser executable.");
  process.exit(1);
}

if (!existsSync(DOCS)) mkdirSync(DOCS, { recursive: true });

const WIDTH = 1440;
const HEIGHT = 960;

const browser = await puppeteer.launch({
  executablePath,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars", "--force-color-profile=srgb"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
  console.log("Loading", URL);
  await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });

  // Wait for at least one Plotly chart to finish rendering.
  await page.waitForSelector(".plot-host svg.main-svg", { timeout: 30000 });
  // Small settle for chart animations / layout.
  await new Promise((r) => setTimeout(r, 1200));

  const hero = join(DOCS, "dashboard.png");
  await page.screenshot({ path: hero, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  console.log("Wrote", hero);

  const full = join(DOCS, "dashboard-full.png");
  await page.screenshot({ path: full, fullPage: true });
  console.log("Wrote", full);
} finally {
  await browser.close();
}
