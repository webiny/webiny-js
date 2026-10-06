/**
 * Builds the baseline report from the runs the driver recorded, plus the review sheet for the human
 * verdicts that Realpage's measure needs. Reads only: no stage is triggered and no model is called.
 *
 *     WEBINY_API_URL=… WEBINY_API_TOKEN=… node scripts/baseline/report.mjs \
 *         --config scripts/baseline/sites.json --state <dir>/state.json --out <dir>
 *
 * Writes `<out>/baseline-report.md`, `<out>/review-sheet.md` and the side-by-side images under
 * `<out>/images/`. Verdicts are given in the admin, on each component's Generate card, and stored in the
 * run's correction log; when any exist the report computes the share migrated without manual edits,
 * per site and overall, from the verdicts given on each component's current output.
 *
 * Repeatable: run it again after a later milestone with that milestone's state file.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { MODEL_PRICES_TAKEN_ON, summarizeCost } from "../../src/domain/modelCost.ts";
import { findNodeByBox } from "../../src/features/stages/cluster/sectionNode.ts";
import { visibleSectionImageCount } from "../../src/features/shared/renderedImages.ts";
import { sectionShape } from "../../src/features/stages/cluster/sectionShape.ts";
import { sectionSimilarity } from "../../src/features/stages/cluster/similarity.ts";
import {
  createClient,
  getGeneratedComponent,
  getRenders,
  getReviews,
  getRun,
  getStageArtifact,
  listModelCalls
} from "./client.mjs";

const { values: args } = parseArgs({
  options: {
    config: { type: "string" },
    state: { type: "string" },
    out: { type: "string" }
  }
});
if (!args.config || !args.state || !args.out) {
  throw new Error("--config, --state and --out are required.");
}

const client = createClient();
const config = JSON.parse(await readFile(args.config, "utf8"));
const state = JSON.parse(await readFile(args.state, "utf8"));
const OUT = path.resolve(args.out);
await mkdir(path.join(OUT, "images"), { recursive: true });

/** The band a rendered component's height has to fall in to count as the right size. */
const HEIGHT_BAND = { min: 0.67, max: 1.5 };
/** The cluster threshold the pipeline uses by default — the same bar for "the same block" here. */
const SAME_BLOCK = 0.85;
const DESKTOP_WIDTH = 1440;

const usd = value => (value === null || value === undefined ? "n/a" : `$${value.toFixed(2)}`);
const pct = (part, whole) => (whole > 0 ? `${((100 * part) / whole).toFixed(0)}%` : "n/a");
const num = value => (value === null || value === undefined ? "n/a" : String(value));
const ratio = value => (value === null ? "n/a" : `${value.toFixed(2)}x`);
const slug = value =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
const minutes = (from, to) =>
  from && to ? `${((new Date(to) - new Date(from)) / 60000).toFixed(1)} min` : "n/a";
const pathOf = url => {
  try {
    return new URL(url).pathname.replace(/\/+$/, "").toLowerCase() || "/";
  } catch {
    return url;
  }
};

const saveImage = async (runId, ref, file) => {
  if (!ref) {
    return null;
  }
  try {
    const bytes = await client.blob(runId, ref, "image");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, bytes);
    return path.relative(OUT, file);
  } catch (error) {
    return `unavailable (${error.message})`;
  }
};

// ----- Collect -------------------------------------------------------------------------------------

const sites = [];
for (const site of config.sites) {
  const host = new URL(site.siteUrl).host;
  const recorded = state.sites?.[host];
  if (!recorded?.runId) {
    sites.push({ site, host, missing: true });
    continue;
  }
  const runId = recorded.runId;
  const run = await getRun(client, runId);
  const [capture, segment, cluster, classify, plan, generate, renderArtifact, calls] =
    await Promise.all([
      getStageArtifact(client, runId, "capture"),
      getStageArtifact(client, runId, "segment"),
      getStageArtifact(client, runId, "cluster"),
      getStageArtifact(client, runId, "classify"),
      getStageArtifact(client, runId, "plan"),
      getStageArtifact(client, runId, "generate"),
      getRenders(client, runId),
      listModelCalls(client, runId)
    ]);
  const renders = new Map((renderArtifact?.renders ?? []).map(r => [r.signature, r]));
  const generated = new Map((generate?.components ?? []).map(c => [c.signature, c]));
  const noOutput = generate?.noOutput ?? {};

  const components = [];
  const trees = new Map();
  const expectedImagesOf = async (runId, segment, reference, box) => {
    const page = (segment?.pages ?? []).find(p => p.url === reference?.url);
    if (page && box) {
      if (!trees.has(page.treeRef)) {
        trees.set(
          page.treeRef,
          await client
            .blob(runId, page.treeRef, "tree")
            .then(bytes => JSON.parse(new TextDecoder().decode(bytes)))
            .catch(() => null)
        );
      }
      const tree = trees.get(page.treeRef);
      const section = tree ? findNodeByBox(tree, box) : null;
      if (section) {
        return visibleSectionImageCount(section, box);
      }
    }
    return (reference?.digest?.imageCount ?? 0) + 0;
  };
  for (const [index, planned] of (plan?.components ?? []).entries()) {
    const ref = generated.get(planned.signature) ?? null;
    const full = ref ? await getGeneratedComponent(client, runId, planned.signature) : null;
    const render = renders.get(planned.signature) ?? null;
    const box = planned.representativeCrop?.box ?? null;
    const sourceHeight = box?.height ?? null;
    const heightRatio =
      render?.ok && render.height > 0 && sourceHeight ? render.height / sourceHeight : null;
    const reference =
      planned.members?.find(
        member =>
          member.url === planned.representativeCrop?.member?.url &&
          member.sectionIndex === planned.representativeCrop?.member?.sectionIndex
      ) ?? planned.representative;
    // Images visible in the reference section, from its page tree — not every image node it holds.
    const expectedImages = await expectedImagesOf(runId, segment, reference, box);
    const renderedImages = render?.imageCheck?.renderedImageCount ?? null;
    const componentCalls = calls.filter(
      call => call.stage === "generate" && call.signature === planned.signature
    );
    const base = path.join(
      "images",
      slug(host),
      `${String(index + 1).padStart(2, "0")}-${slug(planned.name)}`
    );
    components.push({
      planned,
      ref,
      full,
      render,
      heightRatio,
      expectedImages,
      renderedImages,
      noOutput: ref ? null : (noOutput[planned.signature] ?? "no output recorded"),
      cropWarning: reference?.cropWarning ?? null,
      cost: summarizeCost(componentCalls),
      sourceImage: await saveImage(
        runId,
        planned.representativeCrop?.cropRef,
        path.join(OUT, `${base}-source.png`)
      ),
      renderImage: render?.renderRef
        ? await saveImage(runId, render.renderRef, path.join(OUT, `${base}-render.png`))
        : null
    });
  }

  sites.push({
    site,
    host,
    runId,
    jobId: recorded.jobId,
    timings: recorded.timings ?? {},
    interventions: recorded.interventions ?? [],
    skipStages: recorded.skipStages ?? null,
    run,
    capture,
    segment,
    cluster,
    classify,
    plan,
    generate,
    calls,
    components
  });
}

// ----- Judgements ----------------------------------------------------------------------------------

const validatorsPassed = ref =>
  Boolean(
    ref &&
    ref.validation.bundling?.passed !== false &&
    ref.validation.textPreservation.passed &&
    ref.validation.contractConformance.passed &&
    ref.validation.tokenBinding.passed
  );
const inBand = value => value !== null && value >= HEIGHT_BAND.min && value <= HEIGHT_BAND.max;
const imageProblems = c =>
  (c.render?.imageCheck?.stringifiedValues?.length ?? 0) +
  (c.render?.imageCheck?.failedRequests?.length ?? 0);
/**
 * Whether the render showed an image where the source section showed any. Deliberately not "as many
 * images": the source count comes from boxes, which cannot tell which of a fade carousel's stacked
 * slides is on top, so a partial shortfall is as likely to be the measure as the component. None at
 * all is not. Partial shortfalls are listed separately, as information.
 */
const imagesPresent = c =>
  c.renderedImages === null ? null : c.expectedImages === 0 || c.renderedImages > 0;
const imageShortfall = c =>
  c.renderedImages !== null && c.renderedImages > 0 && c.renderedImages < c.expectedImages;
/** The pages a component appears on: its cluster members' distinct pages. */
const pagesOf = c => Math.max(1, new Set((c.planned.members ?? []).map(member => member.url)).size);
const placements = comps => comps.reduce((total, c) => total + pagesOf(c), 0);
const perComponent = (comps, test) => {
  const count = comps.filter(test).length;
  return `${count} of ${comps.length} (${pct(count, comps.length)})`;
};
const weighted = (comps, test) => {
  const count = comps.filter(test).reduce((total, c) => total + pagesOf(c), 0);
  const all = placements(comps);
  return `${count} of ${all} (${pct(count, all)})`;
};
/**
 * "Passed without problems": generated, every validator green, rendered, the right height, an image
 * where the section showed any, and no broken image. A machine reading, not a verdict — it is the bar
 * a component clears before anyone looks at it.
 */
const clean = c =>
  Boolean(
    c.ref &&
    validatorsPassed(c.ref) &&
    c.render?.ok &&
    inBand(c.heightRatio) &&
    imagesPresent(c) !== false &&
    imageProblems(c) === 0
  );
const failureOf = c => {
  if (!c.ref) {
    return c.noOutput;
  }
  const reasons = [];
  if (!validatorsPassed(c.ref)) {
    const failed = Object.entries(c.ref.validation)
      .filter(([, result]) => result && result.passed === false)
      .map(([name]) => name);
    reasons.push(`validators: ${failed.join(", ")}`);
  }
  if (!c.render) {
    reasons.push("not rendered");
  } else if (!c.render.ok) {
    reasons.push(`render failed: ${c.render.error ?? "no error recorded"}`);
  } else if (!inBand(c.heightRatio)) {
    reasons.push(
      c.heightRatio === null
        ? "rendered blank (no height)"
        : `height ${ratio(c.heightRatio)} of source`
    );
  }
  if (imagesPresent(c) === false) {
    reasons.push(`no image (section showed ${c.expectedImages})`);
  }
  if (imageProblems(c) > 0) {
    reasons.push(`${imageProblems(c)} broken image(s)`);
  }
  return reasons.join("; ");
};

// ----- Sibling segmentation (the G5 sites) ---------------------------------------------------------

const siblings = [];
for (const entry of sites.filter(s => s.site.g5 && !s.missing)) {
  const sections = [];
  for (const page of entry.segment?.pages ?? []) {
    let tree = null;
    try {
      tree = JSON.parse(
        new TextDecoder().decode(await client.blob(entry.runId, page.treeRef, "tree"))
      );
    } catch {
      continue;
    }
    for (const section of page.sections ?? []) {
      const node = findNodeByBox(tree, section.box);
      if (!node) {
        continue;
      }
      sections.push({
        page: pathOf(page.url),
        index: section.index,
        height: section.box.height,
        // No token lookup: each site has its own theme, and the question is whether the markup
        // and layout match, not the colours.
        shape: sectionShape(node, DESKTOP_WIDTH, { colorHexToPath: new Map() }),
        rejections: (section.candidates ?? []).map(candidate => candidate.rejection)
      });
    }
  }
  siblings.push({ host: entry.host, pages: entry.segment?.pages?.length ?? 0, sections });
}

const bestMatch = (shape, others) =>
  others.reduce((best, other) => Math.max(best, sectionSimilarity(shape, other.shape)), 0);

// ----- Write ---------------------------------------------------------------------------------------

const lines = [];
const out = (...text) => lines.push(...text);
const allComponents = sites.flatMap(s => s.components ?? []);
const allCalls = sites.flatMap(s => s.calls ?? []);
const total = summarizeCost(allCalls);

out(
  "# Migration pipeline baseline",
  "",
  `Generated ${new Date().toISOString()} from the runs recorded in \`${path.basename(args.state)}\`. Prices from the table dated ${MODEL_PRICES_TAKEN_ON} (\`src/domain/modelCost.ts\`); cache rates marked \"assumed\" there are the standard multipliers, not published figures.`,
  "",
  "**No Kentico site is in this set.** Four sites are on G5 Marketing Cloud and one on RealPage LeaseStar, identified from public asset and API hosts.",
  "",
  "## Summary",
  "",
  "Two readings of every share, side by side. **Page-weighted** counts each component once for every page it appears on — what a visitor of the migrated site sees: a broken navigation header on 11 pages is 11 broken pages, not one defect. **Per component** counts each component once — how well generation works. Page-weighted leads, because Realpage is judging a migration, not a generator.",
  "",
  "| site | platform | components | placements (component × page) | passed, page-weighted | passed, per component | no output | height outside 0.67–1.5x | spend |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
);
for (const s of sites) {
  if (s.missing) {
    out(`| ${s.host} | ${s.site.platform} | — | — | — | — | — | — | not run |`);
    continue;
  }
  const comps = s.components;
  const rendered = comps.filter(c => c.heightRatio !== null);
  out(
    `| ${s.host} | ${s.site.platform} | ${comps.length} | ${placements(comps)} | ${weighted(comps, clean)} | ${perComponent(comps, clean)} | ${comps.filter(c => !c.ref).length} | ${rendered.filter(c => !inBand(c.heightRatio)).length} of ${rendered.length} | ${usd(summarizeCost(s.calls).usd)} |`
  );
}
const renderedAll = allComponents.filter(c => c.heightRatio !== null);
out(
  `| **all** | | **${allComponents.length}** | **${placements(allComponents)}** | **${weighted(allComponents, clean)}** | **${perComponent(allComponents, clean)}** | **${allComponents.filter(c => !c.ref).length}** | **${renderedAll.filter(c => !inBand(c.heightRatio)).length} of ${renderedAll.length} (${pct(renderedAll.filter(c => !inBand(c.heightRatio)).length, renderedAll.length)})** | **${usd(total.usd)}** |`,
  "",
  '"Passed" is a machine reading: generated, every validator green, rendered, height within 0.67–1.5x of the source section, at least one image where the section showed any, and no broken image. Images are counted as distinct sources visible inside the section box on the source side and as distinct images the render used on the other; a partial shortfall is listed as information, not a failure, because a box-based count cannot see which stacked carousel slide is on top. Components with no output count as failures here and in every share below.',
  "",
  "**What these numbers do not mean.** Every check behind them reads content and structure — text present, props declared, variables known, a height, an image request — and none reads appearance. A component can pass all of them while looking plainly wrong: Park City Place's Property Description passes every check and shows a different photograph from its section, a line pattern tiled over its body text, and the wrong display font. So the validator pass rate and the machine pass rate measure the absence of the defects the checks can see, not fidelity, and neither should be quoted as how much of a site migrated. Realpage's measure is the human verdicts given in the admin.",
  ""
);

/*
 * Realpage's measure, from the human verdicts given in the admin. Only a verdict given on a component's
 * current output counts: one given on an earlier revision judged something else. A component with no
 * output has nothing to review and counts as needing human work. A component nobody has reviewed is
 * left out of the share and reported as coverage — an unreviewed component is not evidence either way.
 */
const reviewed = [];
const verdictLabels = {};
const reasonLabels = {};
for (const s of sites.filter(x => !x.missing)) {
  const data = await getReviews(client, s.runId).catch(() => null);
  for (const option of data?.verdicts ?? []) {
    verdictLabels[option.value] = option.label;
  }
  for (const option of data?.reasons ?? []) {
    reasonLabels[option.value] = option.label;
  }
  for (const c of s.components) {
    const review = data?.reviews?.[c.planned.signature];
    const current = review && c.ref && review.contentSha256 === c.ref.contentSha256 ? review : null;
    reviewed.push({ ...c, host: s.host, review: current, staleReview: Boolean(review && !current) });
  }
}
const eligible = reviewed.filter(c => c.review || !c.ref);
if (reviewed.some(c => c.review)) {
  const migrated = c => c.review?.verdict === "migrated";
  const label = value => verdictLabels[value] ?? value;
  const reviewers = [
    ...new Set(reviewed.filter(c => c.review).map(c => c.review.reviewer?.displayName ?? "unknown"))
  ];
  out(
    "## Realpage's measure: Webiny team review",
    "",
    `Verdicts given in the admin by the Webiny team (${reviewers.join(", ")}), on each component's current output. **Internal review only** — not Realpage's reviewers. A later review by Realpage is reported on its own and never pooled with this one.`,
    "",
    `Two levels, after Realpage's own split of a migration: **${label("migrated")}**, and **${label("needs-polish")}**. A component with no output counts as needing polish; an unreviewed one is left out and counted under coverage.`,
    "",
    `| site | reviewed | ${label("migrated").toLowerCase()}, page-weighted | per component |`,
    "| --- | --- | ---: | ---: |"
  );
  for (const host of [...new Set(reviewed.map(c => c.host))]) {
    const all = reviewed.filter(c => c.host === host);
    const comps = eligible.filter(c => c.host === host);
    out(
      `| ${host} | ${comps.length} of ${all.length} | ${weighted(comps, migrated)} | ${perComponent(comps, migrated)} |`
    );
  }
  out(
    `| **all** | **${eligible.length} of ${reviewed.length}** | **${weighted(eligible, migrated)}** | **${perComponent(eligible, migrated)}** |`,
    ""
  );
  const stale = reviewed.filter(c => c.staleReview).length;
  if (stale > 0) {
    out(
      `${stale} component(s) carry a verdict given on an earlier output and have not been reviewed since; they are counted as unreviewed.`,
      ""
    );
  }
  const polish = reviewed.filter(c => c.review?.verdict === "needs-polish");
  const tally = {};
  for (const c of polish) {
    for (const reason of c.review.reasons ?? []) {
      tally[reason] = (tally[reason] ?? 0) + 1;
    }
  }
  out(
    `Reasons given for the ${polish.length} reviewed component(s) needing polish (several per component allowed, none required):`,
    ""
  );
  for (const [reason, count] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    out(`- ${reasonLabels[reason] ?? reason}: ${count}`);
  }
  const noReason = polish.filter(c => (c.review.reasons ?? []).length === 0).length;
  out(`- no reason given: ${noReason}`, "");
}

out("## Main failure patterns", "");
const patterns = new Map();
for (const c of allComponents.filter(x => !clean(x))) {
  for (const reason of failureOf(c).split("; ")) {
    const key = reason
      .replace(/^height [\d.]+x of source$/, "height outside 0.67–1.5x of source")
      .replace(/^no image \(section showed \d+\)$/, "no image where the section showed one")
      .replace(/\d+ broken image\(s\)/, "broken images");
    patterns.set(key, (patterns.get(key) ?? 0) + 1);
  }
}
out("| pattern | components |", "| --- | ---: |");
for (const [pattern, count] of [...patterns].sort((a, b) => b[1] - a[1])) {
  out(`| ${pattern} | ${count} |`);
}
out("");

for (const s of sites) {
  out(`## ${s.host}`, "");
  if (s.missing) {
    out("Not run — no run recorded in the state file.", "");
    continue;
  }
  out(
    `Platform: **${s.site.platform}** (inferred from ${s.site.platformEvidence}).${s.site.note ? ` ${s.site.note}` : ""}`,
    "",
    `Job \`${s.jobId}\`, run \`${s.runId}\`, status ${s.run?.status}. Theme \`${s.site.themeEntryId}\` v${s.site.themeVersion}.${s.site.themeNote ? ` ${s.site.themeNote}` : ""}`,
    "",
    ...s.interventions.map(note => `**Operator intervention:** ${note}`),
    ...(s.skipStages
      ? [`**Stages not run:** ${s.skipStages.stages.join(", ")} — ${s.skipStages.reason}`]
      : []),
    ...(s.interventions.length || s.skipStages ? [""] : [])
  );

  const pages = s.capture?.pages ?? [];
  const sections = (s.segment?.pages ?? []).flatMap(p => p.sections ?? []);
  const clusters = s.cluster?.clusters ?? [];
  out(
    "| pages captured | pages failed | sections | clusters | components planned | generated | no output |",
    "| ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    `| ${pages.length} | ${(s.capture?.failed ?? []).length} | ${sections.length} | ${clusters.length} | ${s.components.length} | ${s.components.filter(c => c.ref).length} | ${s.components.filter(c => !c.ref).length} |`,
    ""
  );

  const warn = key => pages.filter(p => p.warnings?.[key]).length;
  const cropKinds = kind => sections.filter(x => x.cropWarning?.kind === kind).length;
  out(
    "**Capture and crop warnings**",
    "",
    "| warning | count |",
    "| --- | ---: |",
    `| page screenshot cut short (taller than 32000px) | ${warn("screenshotTruncatedAt")} |`,
    `| page with web fonts that failed to load | ${pages.filter(p => p.warnings?.fontsFailed?.length).length} |`,
    `| page with web fonts still loading after 5s | ${pages.filter(p => p.warnings?.fontsPending?.length).length} |`,
    `| page with an overlay still present | ${warn("overlayRemains")} |`,
    `| page with broken images | ${pages.filter(p => p.warnings?.brokenImages > 0).length} |`,
    `| section with no crop (outside the screenshot) | ${cropKinds("outside-screenshot")} |`,
    `| section with a partial crop | ${cropKinds("partially-outside")} |`,
    `| section with no screenshot to crop from | ${cropKinds("no-screenshot")} |`,
    `| section crop not at true scale | ${sections.filter(x => x.cropScale).length} |`,
    ""
  );
  const failedFonts = [...new Set(pages.flatMap(p => p.warnings?.fontsFailed ?? []))];
  if (failedFonts.length > 0) {
    out(`Fonts that failed: ${failedFonts.join(", ")}.`, "");
  }

  out(
    "**Timings**",
    "",
    "| stage | time |",
    "| --- | ---: |",
    ...[
      "discover",
      "capture",
      "segment",
      "cluster",
      "classify",
      "plan",
      "generate",
      "assemble",
      "promote"
    ].map(
      stage =>
        `| ${stage} | ${minutes(s.timings[stage]?.startedOn, s.timings[stage]?.finishedOn)} |`
    ),
    `| render pass | ${minutes(s.timings.render?.triggeredOn, s.timings.render?.finishedOn)} |`,
    ""
  );

  out(
    "**Components**",
    "",
    "| # | component | type | pages | attempts | validators | height (render/source) | images (rendered/expected) | crop | Generate cost | result | side by side |",
    "| ---: | --- | --- | ---: | ---: | --- | ---: | ---: | --- | ---: | --- | --- |"
  );
  for (const [i, c] of s.components.entries()) {
    const v = c.ref?.validation;
    const validators = v
      ? ["bundling", "textPreservation", "contractConformance", "tokenBinding"]
          .map(
            name =>
              `${{ bundling: "B", textPreservation: "T", contractConformance: "C", tokenBinding: "K" }[name]}${v[name]?.passed === false ? "✗" : "✓"}`
          )
          .join(" ")
      : "—";
    out(
      `| ${i + 1} | ${c.planned.name} | ${c.planned.type} | ${c.ref?.pageCount ?? new Set((c.planned.members ?? []).map(m => m.url)).size} | ${num(c.ref?.attempts)} | ${validators} | ${ratio(c.heightRatio)} | ${num(c.renderedImages)}/${c.expectedImages} | ${c.cropWarning ? c.cropWarning.kind : c.planned.representativeCrop?.cropRef ? "ok" : "none"} | ${usd(c.cost.usd)} | ${clean(c) ? "passed" : failureOf(c)} | ${c.sourceImage ? `[source](${c.sourceImage})` : "no source"} · ${c.renderImage ? `[render](${c.renderImage})` : "no render"} |`
    );
  }
  out(
    "",
    "Validators: B bundling, T text preservation, C contract conformance, K token binding.",
    ""
  );

  const noOutput = s.components.filter(c => !c.ref);
  if (noOutput.length > 0) {
    out("**Components with no output (counted as failures)**", "");
    for (const c of noOutput) {
      out(`- ${c.planned.name} (\`${c.planned.signature.slice(0, 12)}\`): ${c.noOutput}`);
    }
    out("");
  }

  out(
    "**Model usage and cost**",
    "",
    "| stage | model(s) | calls | input | cache read | cache write | output | cost | saved by caching |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  );
  for (const stage of ["classify", "plan", "generate"]) {
    const stageCalls = s.calls.filter(call => call.stage === stage);
    const sum = summarizeCost(stageCalls);
    const models = [...new Set(stageCalls.map(call => call.modelId))].join(", ") || "—";
    const named = [...new Set(stageCalls.map(call => call.name))].filter(n =>
      n.startsWith("regenerate")
    );
    out(
      `| ${stage}${named.length ? ` (incl. ${named.join(", ")})` : ""} | ${models} | ${sum.calls} | ${sum.inputTokens} | ${sum.cacheReadTokens} | ${sum.cacheWriteTokens} | ${sum.outputTokens} | ${usd(sum.usd)} | ${usd(sum.cacheSavingUsd)} |`
    );
  }
  const siteSum = summarizeCost(s.calls);
  const generated = s.components.filter(c => c.cost.calls > 0);
  out(
    `| **total** | | ${siteSum.calls} | ${siteSum.inputTokens} | ${siteSum.cacheReadTokens} | ${siteSum.cacheWriteTokens} | ${siteSum.outputTokens} | **${usd(siteSum.usd)}** | ${usd(siteSum.cacheSavingUsd)} |`,
    "",
    `Generate per component: ${generated.length > 0 ? `${usd(generated.reduce((t, c) => t + c.cost.usd, 0) / generated.length)} mean over ${generated.length} component(s), ${(generated.reduce((t, c) => t + c.cost.calls, 0) / generated.length).toFixed(2)} calls each` : "n/a"}.${siteSum.unpricedCalls ? ` ${siteSum.unpricedCalls} call(s) to unpriced models are not in the cost.` : ""}`,
    ""
  );
}

out(
  "## Across all sites",
  "",
  `- Components: ${allComponents.length}; generated ${allComponents.filter(c => c.ref).length}; no output ${allComponents.filter(c => !c.ref).length}.`,
  `- Passed (machine reading): ${weighted(allComponents, clean)} page placements; ${perComponent(allComponents, clean)} components.`,
  `- Every validator green: ${allComponents.filter(c => validatorsPassed(c.ref)).length} (${pct(allComponents.filter(c => validatorsPassed(c.ref)).length, allComponents.length)}).`,
  `- Height outside 0.67–1.5x of source: ${renderedAll.filter(c => !inBand(c.heightRatio)).length} of ${renderedAll.length} rendered (${pct(renderedAll.filter(c => !inBand(c.heightRatio)).length, renderedAll.length)}); too tall ${renderedAll.filter(c => c.heightRatio > HEIGHT_BAND.max).length}, too short ${renderedAll.filter(c => c.heightRatio < HEIGHT_BAND.min).length}.`,
  `- Mean height ratio: ${renderedAll.length ? ratio(renderedAll.reduce((t, c) => t + c.heightRatio, 0) / renderedAll.length) : "n/a"}; mean attempts: ${(allComponents.filter(c => c.ref).reduce((t, c) => t + c.ref.attempts, 0) / Math.max(1, allComponents.filter(c => c.ref).length)).toFixed(2)}.`,
  `- Images: ${allComponents.filter(c => imagesPresent(c) === false).length} component(s) show no image where their section showed one; ${allComponents.filter(c => imageProblems(c) > 0).length} have a broken image; ${allComponents.filter(imageShortfall).length} show fewer images than were visible in the section (information only: ${
    allComponents
      .filter(imageShortfall)
      .map(c => `${c.planned.name} ${c.renderedImages}/${c.expectedImages}`)
      .join(", ") || "none"
  }).`,
  `- Spend: ${usd(total.usd)} over ${total.calls} model calls; cache read ${total.cacheReadTokens} and write ${total.cacheWriteTokens} input tokens; caching saved ${usd(total.cacheSavingUsd)}.${total.unpricedCalls ? ` ${total.unpricedCalls} unpriced call(s) excluded.` : ""}`,
  `- Models used: ${[...new Set(allCalls.map(call => `${call.stage}: ${call.modelId}`))].sort().join("; ") || "none recorded"}.`,
  ""
);

out(
  "## Sibling segmentation across the G5 sites",
  "",
  `Four of the five sites are on G5 Marketing Cloud. This compares how Segment cut them, from the runs' own trees and section boxes; no model was called. Sections are compared by layout alone — tag structure and geometry, without colours, since each site has its own theme — using the clustering similarity at its default ${SAME_BLOCK} threshold.`,
  "",
  "| site | pages | sections | sections/page | sections 800–1000px tall (container-split flip risk) | sections under 160px |",
  "| --- | ---: | ---: | ---: | ---: | ---: |"
);
for (const sib of siblings) {
  out(
    `| ${sib.host} | ${sib.pages} | ${sib.sections.length} | ${(sib.sections.length / Math.max(1, sib.pages)).toFixed(1)} | ${sib.sections.filter(x => x.height >= 800 && x.height <= 1000).length} | ${sib.sections.filter(x => x.height < 160).length} |`
  );
}
out(
  "",
  `Share of each site's sections with a layout match (similarity ≥ ${SAME_BLOCK}) somewhere on the other site:`,
  "",
  `| site \\ against | ${siblings.map(s => s.host).join(" | ")} |`,
  `| --- | ${siblings.map(() => "---:").join(" | ")} |`
);
for (const a of siblings) {
  const cells = siblings.map(b => {
    if (a === b) {
      return "—";
    }
    const matched = a.sections.filter(x => bestMatch(x.shape, b.sections) >= SAME_BLOCK).length;
    return pct(matched, a.sections.length);
  });
  out(`| ${a.host} | ${cells.join(" | ")} |`);
}
const commonPages = [...new Set(siblings.flatMap(s => s.sections.map(x => x.page)))]
  .filter(page => siblings.filter(s => s.sections.some(x => x.page === page)).length >= 2)
  .sort();
if (commonPages.length > 0) {
  out(
    "",
    "Pages present on two or more G5 sites, by path — sections per page, and how many of each site's sections on that page match one on the same page of another site:",
    "",
    `| page | ${siblings.map(s => s.host).join(" | ")} |`,
    `| --- | ${siblings.map(() => "---").join(" | ")} |`
  );
  for (const page of commonPages) {
    const cells = siblings.map(sib => {
      const mine = sib.sections.filter(x => x.page === page);
      if (mine.length === 0) {
        return "—";
      }
      const others = siblings
        .filter(other => other !== sib)
        .flatMap(other => other.sections.filter(x => x.page === page));
      const matched = mine.filter(
        x => others.length && bestMatch(x.shape, others) >= SAME_BLOCK
      ).length;
      return `${mine.length} sections, ${matched} matched`;
    });
    out(`| \`${page}\` | ${cells.join(" | ")} |`);
  }
}
const rejectionCounts = sib => {
  const counts = {};
  for (const reason of sib.sections.flatMap(x => x.rejections)) {
    counts[reason] = (counts[reason] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${reason} ${count}`)
    .join(", ");
};
out("", "Boundaries Segment considered and rejected, by reason:", "");
for (const sib of siblings) {
  out(`- ${sib.host}: ${rejectionCounts(sib) || "none"}`);
}
out("");

await writeFile(path.join(OUT, "baseline-report.md"), lines.join("\n"));

// ----- Review sheet --------------------------------------------------------------------------------

const sheet = [
  "# Baseline review sheet",
  "",
  "Verdicts are given in the admin, not here: open each site's run, go to Generate, and use the Review panel at the foot of each component card. Pick **Migrated without manual edits** or **Needs human polish**; reasons and a note are optional. A verdict is recorded against the output on screen — if the component is regenerated afterwards, it needs reviewing again. Verdicts do not change what Promote moves. Run the report again to compute the share.",
  "",
  "This listing is for orientation: every planned component with its machine reading. Rows with no output have nothing to review and count as needing polish.",
  "",
  "| site | run | # | component | type | pages | machine reading | source | render |",
  "| --- | --- | ---: | --- | --- | ---: | --- | --- | --- |"
];
for (const s of sites.filter(x => !x.missing)) {
  for (const [i, c] of s.components.entries()) {
    const reading = clean(c) ? "passed" : failureOf(c);
    const pages = c.ref?.pageCount ?? new Set((c.planned.members ?? []).map(m => m.url)).size;
    sheet.push(
      `| ${s.host} | \`${s.runId}\` | ${i + 1} | ${c.planned.name} | ${c.planned.type} | ${pages} | ${reading} | ${c.sourceImage ? `![](${c.sourceImage})` : "—"} | ${c.renderImage ? `![](${c.renderImage})` : "no render"} |`
    );
  }
}
await writeFile(path.join(OUT, "review-sheet.md"), sheet.join("\n"));
console.log(
  `Wrote ${path.join(OUT, "baseline-report.md")}, review-sheet.md and ${allComponents.length} component image pair(s).`
);
