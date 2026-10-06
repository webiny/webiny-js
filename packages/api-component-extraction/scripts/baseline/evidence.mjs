/**
 * Before-and-after evidence for the capture and crop fixes, from real runs: each site's earlier run
 * (captured before the fixes) against its baseline run (captured after). Reads only.
 *
 *     WEBINY_API_URL=… WEBINY_API_TOKEN=… node scripts/baseline/evidence.mjs \
 *         --before before.json --state <dir>/state.json --out <dir> [--pages 12]
 *
 * `before.json` maps a site's host to the run id of its earlier run: { "www.example.com": "<runId>" }.
 *
 * What it measures, per page captured in both runs (up to `--pages` per site):
 *   - the full-page screenshot's height against the height the tree recorded at the capture viewport —
 *     the drift the grown viewport caused shows as a screenshot taller or shorter than the page the
 *     tree describes;
 *   - sections whose box lies wholly or partly below the bottom of the screenshot — where the old crop
 *     clamp produced 1-pixel crops;
 *   - each section crop's size against its box, which shows the width shrink on tall sections.
 * And it saves, for the page with the largest drift on each site, the first section's crop from both
 * runs side by side.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
import { createClient, getStageArtifact } from "./client.mjs";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const { values: args } = parseArgs({
  options: {
    before: { type: "string" },
    state: { type: "string" },
    out: { type: "string" },
    pages: { type: "string", default: "12" }
  }
});
if (!args.before || !args.state || !args.out) {
  throw new Error("--before, --state and --out are required.");
}
const client = createClient();
const before = JSON.parse(await readFile(args.before, "utf8"));
const state = JSON.parse(await readFile(args.state, "utf8"));
const OUT = path.resolve(args.out);
const PAGES = Number(args.pages);
await mkdir(path.join(OUT, "evidence"), { recursive: true });

const sizeOf = async (runId, ref) => {
  if (!ref) {
    return null;
  }
  try {
    const bytes = await client.blob(runId, ref, "image");
    const meta = await sharp(bytes).metadata();
    return { width: meta.width, height: meta.height, bytes };
  } catch {
    return null;
  }
};

const measureRun = async (runId, urls) => {
  const capture = await getStageArtifact(client, runId, "capture");
  const segment = await getStageArtifact(client, runId, "segment");
  const sectionsByUrl = new Map(
    (segment?.pages ?? []).map(page => [page.url, page.sections ?? []])
  );
  const pages = new Map();
  for (const page of capture?.pages ?? []) {
    if (urls && !urls.has(page.url)) {
      continue;
    }
    const screenshot = await sizeOf(runId, page.screenshotRef);
    const sections = sectionsByUrl.get(page.url) ?? [];
    const crops = [];
    for (const section of sections) {
      const crop = await sizeOf(runId, section.cropRef);
      crops.push({ section, crop });
    }
    pages.set(page.url, { page, screenshot, crops });
  }
  return pages;
};

const lines = [
  "# Before and after: capture and crop fixes",
  "",
  "Each site's earlier run (captured before the fixes) against its baseline run (after). Heights in CSS pixels; a screenshot is 1 pixel per CSS pixel unless it was downscaled.",
  ""
];
const rows = [];
for (const [host, beforeRun] of Object.entries(before)) {
  const afterRun = state.sites?.[host]?.runId;
  if (!afterRun) {
    continue;
  }
  const afterPages = await measureRun(afterRun, null);
  const shared = new Set([...afterPages.keys()].slice(0, PAGES));
  const beforePages = await measureRun(beforeRun, shared);

  const tally = {
    pages: 0,
    driftBefore: [],
    driftAfter: [],
    beyondBefore: 0,
    beyondAfter: 0,
    sliverBefore: 0,
    sliverAfter: 0,
    shrunkBefore: 0,
    shrunkAfter: 0,
    sections: [0, 0]
  };
  let worst = null;
  for (const url of shared) {
    const b = beforePages.get(url);
    const a = afterPages.get(url);
    if (!b || !a) {
      continue;
    }
    tally.pages++;
    for (const [side, run, drifts] of [
      ["before", b, tally.driftBefore],
      ["after", a, tally.driftAfter]
    ]) {
      const shotHeight = run.screenshot?.height ?? null;
      const scale = run.screenshot ? run.screenshot.width / 1440 : 1;
      const drift = shotHeight === null ? null : shotHeight / scale - run.page.documentHeight;
      drifts.push(drift);
      for (const { section, crop } of run.crops) {
        const bottom = (section.box.y + section.box.height) * scale;
        const beyond = shotHeight !== null && bottom > shotHeight + 2;
        const sliver = crop && crop.height <= 2 && section.box.height > 16;
        const shrunk = crop && crop.width < Math.round(section.box.width * scale) - 2;
        if (side === "before") {
          tally.sections[0]++;
          tally.beyondBefore += beyond ? 1 : 0;
          tally.sliverBefore += sliver ? 1 : 0;
          tally.shrunkBefore += shrunk ? 1 : 0;
        } else {
          tally.sections[1]++;
          tally.beyondAfter += beyond ? 1 : 0;
          tally.sliverAfter += sliver ? 1 : 0;
          tally.shrunkAfter += shrunk ? 1 : 0;
        }
      }
    }
    const driftBefore = tally.driftBefore[tally.driftBefore.length - 1];
    if (driftBefore !== null && (!worst || Math.abs(driftBefore) > Math.abs(worst.drift))) {
      worst = { url, drift: driftBefore, b, a };
    }
  }

  const fmt = list => {
    const known = list.filter(v => v !== null);
    if (known.length === 0) {
      return "n/a";
    }
    const off = known.filter(v => Math.abs(v) > 2).length;
    const max = Math.max(...known.map(v => Math.abs(v)));
    return `${off} of ${known.length} pages off by more than 2px (largest ${max.toFixed(0)}px)`;
  };
  rows.push(
    `| ${host} | ${tally.pages} | ${fmt(tally.driftBefore)} | ${fmt(tally.driftAfter)} | ${tally.beyondBefore} / ${tally.sliverBefore} | ${tally.beyondAfter} / ${tally.sliverAfter} | ${tally.shrunkBefore} of ${tally.sections[0]} | ${tally.shrunkAfter} of ${tally.sections[1]} |`
  );

  if (worst) {
    const dir = path.join(OUT, "evidence", host);
    await mkdir(dir, { recursive: true });
    const first = run => run.crops.find(entry => entry.crop)?.crop?.bytes;
    const saved = [];
    for (const [label, run] of [
      ["before", worst.b],
      ["after", worst.a]
    ]) {
      const bytes = first(run);
      if (bytes) {
        await writeFile(path.join(dir, `first-section-${label}.png`), bytes);
        saved.push(
          `[${label}](${path.relative(OUT, path.join(dir, `first-section-${label}.png`))})`
        );
      }
    }
    lines.push(
      `- **${host}**, \`${new URL(worst.url).pathname}\`: the earlier screenshot was ${worst.drift > 0 ? "taller" : "shorter"} than the tree's page by ${Math.abs(worst.drift).toFixed(0)}px. First section crop: ${saved.join(" · ") || "unavailable"}.`
    );
  }
}

lines.splice(
  4,
  0,
  "| site | pages compared | screenshot vs tree height, before | after | sections below the screenshot / 1px crops, before | after | crops narrower than their section, before | after |",
  "| --- | ---: | --- | --- | --- | --- | --- | --- |",
  ...rows,
  "",
  "Largest drift per site, with the first section's crop from each run:",
  ""
);
await writeFile(path.join(OUT, "before-after.md"), lines.join("\n"));
console.log(`Wrote ${path.join(OUT, "before-after.md")}.`);
