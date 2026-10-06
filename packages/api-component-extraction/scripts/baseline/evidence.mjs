/**
 * Before-and-after evidence for the capture and crop fixes, from real runs: each site's earlier run
 * (captured before the fixes) against its baseline run (captured after). Reads only.
 *
 *     WEBINY_API_URL=… WEBINY_API_TOKEN=… node scripts/baseline/evidence.mjs \
 *         --before before.json --state <dir>/state.json --out <dir> [--pages 12]
 *
 * `before.json` maps a site's host to the run id of its earlier run: { "www.example.com": "<runId>" }.
 *
 * Viewport-height drift cannot be read off a screenshot's size: the old capture measured the page,
 * grew the viewport to exactly that height and shot it, so the image was always as tall as the tree's
 * page — the content inside it moved, the frame did not. So drift is measured on the crops instead.
 * Sections are matched across the two runs by identical box on the same page — the tree laid the
 * section out in the same place both times — and each pair of crops is compared. Without drift a
 * matched pair shows the same content; with it, everything below a viewport-height element shows
 * whatever slid into that box. The comparison is a coarse greyscale difference, used only to rank
 * pairs and pick examples: it is read alongside the images, never as a score.
 *
 * Also counted per run: sections whose box runs below the bottom of the screenshot, 1-pixel crops (the
 * old clamp), and crops narrower than their section (the old width shrink).
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
    pages: { type: "string", default: "12" },
    examples: { type: "string", default: "3" }
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
const EXAMPLES = Number(args.examples);
await mkdir(path.join(OUT, "evidence"), { recursive: true });

const fetchImage = async (runId, ref) => {
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

/** Mean absolute greyscale difference of two images squeezed to 64x64, 0..1. Ranking only. */
const difference = async (a, b) => {
  const grid = async bytes =>
    sharp(bytes).resize(64, 64, { fit: "fill" }).greyscale().raw().toBuffer();
  const [ga, gb] = await Promise.all([grid(a), grid(b)]);
  let total = 0;
  for (let i = 0; i < ga.length; i++) {
    total += Math.abs(ga[i] - gb[i]);
  }
  return total / (ga.length * 255);
};

const boxKey = box => `${box.x},${box.y},${box.width},${box.height}`;

const readRun = async runId => {
  const [capture, segment] = await Promise.all([
    getStageArtifact(client, runId, "capture"),
    getStageArtifact(client, runId, "segment")
  ]);
  return {
    pages: new Map((capture?.pages ?? []).map(page => [page.url, page])),
    sections: new Map((segment?.pages ?? []).map(page => [page.url, page.sections ?? []]))
  };
};

const tallyRun = async (runId, run, urls) => {
  const tally = { sections: 0, beyond: 0, sliver: 0, shrunk: 0 };
  for (const url of urls) {
    const page = run.pages.get(url);
    const screenshot = page ? await fetchImage(runId, page.screenshotRef) : null;
    const scale = screenshot ? screenshot.width / 1440 : 1;
    for (const section of run.sections.get(url) ?? []) {
      tally.sections++;
      const crop = await fetchImage(runId, section.cropRef);
      const bottom = (section.box.y + section.box.height) * scale;
      if (screenshot && bottom > screenshot.height + 2) {
        tally.beyond++;
      }
      if (crop && crop.height <= 2 && section.box.height > 16) {
        tally.sliver++;
      }
      if (crop && crop.width < Math.round(section.box.width * scale) - 2) {
        tally.shrunk++;
      }
    }
  }
  return tally;
};

const lines = [
  "# Before and after: capture and crop fixes",
  "",
  "Each site's earlier run (captured before the fixes) against its baseline run (after), on the pages both captured. Sections are matched across runs by identical box on the same page; each matched pair of crops is compared with a coarse greyscale difference used only to rank pairs for inspection.",
  ""
];
const table = [
  "| site | pages | matched sections | matched pairs that differ (>0.10) | sections below the screenshot, before / after | 1px crops, before / after | crops narrower than their section, before / after |",
  "| --- | ---: | ---: | ---: | --- | --- | --- |"
];
const examples = [];

for (const [host, beforeRunId] of Object.entries(before)) {
  const afterRunId = state.sites?.[host]?.runId;
  if (!afterRunId) {
    continue;
  }
  const [b, a] = await Promise.all([readRun(beforeRunId), readRun(afterRunId)]);
  const urls = [...a.pages.keys()].filter(url => b.pages.has(url)).slice(0, PAGES);

  const pairs = [];
  for (const url of urls) {
    const beforeByBox = new Map((b.sections.get(url) ?? []).map(s => [boxKey(s.box), s]));
    for (const section of a.sections.get(url) ?? []) {
      const match = beforeByBox.get(boxKey(section.box));
      if (!match || !match.cropRef || !section.cropRef) {
        continue;
      }
      const [cb, ca] = await Promise.all([
        fetchImage(beforeRunId, match.cropRef),
        fetchImage(afterRunId, section.cropRef)
      ]);
      if (!cb || !ca) {
        continue;
      }
      pairs.push({ url, box: section.box, diff: await difference(cb.bytes, ca.bytes), cb, ca });
    }
  }

  const [tb, ta] = await Promise.all([
    tallyRun(beforeRunId, b, urls),
    tallyRun(afterRunId, a, urls)
  ]);
  table.push(
    `| ${host} | ${urls.length} | ${pairs.length} | ${pairs.filter(p => p.diff > 0.1).length} | ${tb.beyond} / ${ta.beyond} | ${tb.sliver} / ${ta.sliver} | ${tb.shrunk} of ${tb.sections} / ${ta.shrunk} of ${ta.sections} |`
  );

  const dir = path.join(OUT, "evidence", host);
  await mkdir(dir, { recursive: true });
  for (const [i, pair] of pairs
    .sort((x, y) => y.diff - x.diff)
    .slice(0, EXAMPLES)
    .entries()) {
    const stem = `${i + 1}-${new URL(pair.url).pathname.replace(/[^a-z0-9]+/gi, "-") || "home"}-y${pair.box.y}`;
    await writeFile(path.join(dir, `${stem}-before.png`), pair.cb.bytes);
    await writeFile(path.join(dir, `${stem}-after.png`), pair.ca.bytes);
    examples.push(
      `- **${host}** \`${new URL(pair.url).pathname}\`, section at y=${pair.box.y} (${pair.box.width}x${pair.box.height}), difference ${pair.diff.toFixed(2)}: [before](${path.relative(OUT, path.join(dir, `${stem}-before.png`))}) ${pair.cb.width}x${pair.cb.height} · [after](${path.relative(OUT, path.join(dir, `${stem}-after.png`))}) ${pair.ca.width}x${pair.ca.height}`
    );
  }
}

lines.push(
  ...table,
  "",
  "**Read the last three columns with their denominator.** Sections below the screenshot, 1-pixel crops and narrowed crops only appear where a site has the case — a page taller than the cap, a box past the screenshot's bottom, a section taller than the crop limit. A zero before and after means that fix was not exercised on these pages, not that it was shown to work. Only the matched-pair column and a non-zero 'before' are evidence of a fix.",
  "",
  `The most different matched pairs per site (up to ${EXAMPLES}), to inspect by eye. A difference here can also be content that changed between the two captures — a rotated special, a new photo — so each needs looking at before it counts as drift.`,
  "",
  ...examples,
  ""
);
await writeFile(path.join(OUT, "before-after.md"), lines.join("\n"));
console.log(`Wrote ${path.join(OUT, "before-after.md")}.`);
