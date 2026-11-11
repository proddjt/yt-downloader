import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- Settings -------------------------------------------------------------
const LINKS_FILE = path.join(__dirname, "links.json");
const OUTPUT_DIR = path.join(__dirname, "downloads");
const PARALLEL = 4; // how many downloads run at the same time
const YTDLP = process.env.YTDLP_PATH || "yt-dlp"; // "yt-dlp" works if it's in your PATH
const AUDIO_QUALITY = "0"; // 0 = best VBR, 10 = worst (or e.g. "192K")
// ---------------------------------------------------------------------------

// Load links.json
let links;
try {
  links = JSON.parse(fs.readFileSync(LINKS_FILE, "utf8"));
} catch (err) {
  console.error(`Could not read ${LINKS_FILE}: ${err.message}`);
  process.exit(1);
}
if (!Array.isArray(links) || links.length === 0) {
  console.error("links.json must contain a non-empty array of links.");
  process.exit(1);
}

// Clean up: trim, drop empties/non-strings, dedupe, turn bare video IDs into URLs
const urls = [
  ...new Set(
    links
      .filter((l) => typeof l === "string" && l.trim())
      .map((l) => l.trim())
      .map((l) => (/^[\w-]{11}$/.test(l) ? `https://www.youtube.com/watch?v=${l}` : l))
  ),
];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function downloadOne(url) {
  return new Promise((resolve) => {
    const args = [
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", AUDIO_QUALITY,
      "--no-playlist", // if a link has &list=..., only download that one video
      "--no-progress",
      "--retries", "5",
      "-P", OUTPUT_DIR,
      "-o", "%(title)s.%(ext)s",
      url,
    ];

    const child = spawn(YTDLP, args);
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      // e.g. yt-dlp not found in PATH
      resolve({ url, ok: false, error: err.message });
    });
    child.on("close", (code) => {
      if (code === 0) return resolve({ url, ok: true });
      const lastLine = stderr.trim().split("\n").pop() || `exit code ${code}`;
      resolve({ url, ok: false, error: lastLine });
    });
  });
}

// Simple worker pool: PARALLEL workers keep pulling the next link from the queue
async function main() {
  console.log(`Downloading ${urls.length} link(s), ${PARALLEL} at a time...\n`);

  const results = [];
  let next = 0;
  let done = 0;

  async function worker() {
    while (next < urls.length) {
      const url = urls[next++];
      console.log(`▶ Starting: ${url}`);
      const result = await downloadOne(url);
      results.push(result);
      done++;
      console.log(
        `${result.ok ? "✔" : "✖"} [${done}/${urls.length}] ${url}` +
          (result.ok ? "" : `\n    ${result.error}`)
      );
    }
  }

  await Promise.all(Array.from({ length: Math.min(PARALLEL, urls.length) }, worker));

  const failed = results.filter((r) => !r.ok);
  console.log("\n=========== Summary ===========");
  console.log(`Downloaded: ${results.length - failed.length}`);
  console.log(`Failed:     ${failed.length}`);
  failed.forEach((f) => console.log(`  - ${f.url}: ${f.error}`));
  console.log(`Files saved in: ${OUTPUT_DIR}`);
  process.exit(failed.length ? 1 : 0);
}

main();