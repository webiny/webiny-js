/**
 * Runs the baseline: every configured site through all nine stages, then the render pass, one site at a
 * time, with a spend ceiling.
 *
 *     WEBINY_API_URL=… WEBINY_API_TOKEN=… node scripts/baseline/run.mjs \
 *         --config scripts/baseline/sites.json --state <dir>/state.json [--budget 60] [--only <host>]
 *
 * The baseline has to measure the automation alone, so:
 *   - every site gets a FRESH job, and the script refuses to run a job that carries any override;
 *   - nothing is corrected, excluded or regenerated — stages run with their defaults (cluster
 *     threshold, container height) and their machine output flows straight on;
 *   - a stage that fails is recorded and the site stops there. Nothing is retried or fixed mid-run.
 *
 * Resumable: the state file records each site's job and run, and a rerun picks each site up from its
 * first stage that is not done. A stage already running is waited on, never re-triggered.
 *
 * Spend: after every model-backed stage, the cost of every model call across all baseline runs is
 * priced from the dated table in `src/domain/modelCost.ts`. The script stops if the total passes the
 * budget, and before each Generate it stops if the spend so far plus a projection for that Generate
 * would pass it. A call to a model with no price entry stops the script too: an unpriced call is spend
 * the ceiling cannot see.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { summarizeCost, costOfCall } from "../../src/domain/modelCost.ts";
import {
  createClient,
  getRun,
  getRenders,
  getStageArtifact,
  listModelCalls,
  RUN_FIELDS,
  sleep
} from "./client.mjs";

const STAGES = [
  "discover",
  "capture",
  "segment",
  "cluster",
  "classify",
  "plan",
  "generate",
  "assemble",
  "promote"
];
const MODEL_STAGES = new Set(["classify", "plan", "generate"]);
const POLL_MS = 10_000;
const STAGE_TIMEOUT_MS = { default: 60 * 60_000, generate: 150 * 60_000 };
const RENDER_TIMEOUT_MS = 60 * 60_000;
/** Used for the pre-Generate projection when no Generate call has been recorded yet. */
const FALLBACK_GENERATE_CALL_USD = 0.3;
/** Calls per component, recorded: 11/7, 24/13, 38/30 on earlier runs — 1.85 is the worst. */
const PROJECTED_CALLS_PER_COMPONENT = 1.85;

const { values: args } = parseArgs({
  options: {
    config: { type: "string" },
    state: { type: "string" },
    budget: { type: "string", default: "60" },
    only: { type: "string" }
  }
});
if (!args.config || !args.state) {
  throw new Error("--config and --state are required.");
}
const budget = Number(args.budget);
const client = createClient();

const config = JSON.parse(await readFile(args.config, "utf8"));
const readState = async () => {
  try {
    return JSON.parse(await readFile(args.state, "utf8"));
  } catch {
    return { startedOn: new Date().toISOString(), budgetUsd: budget, sites: {} };
  }
};
const state = await readState();
const save = async () => {
  await mkdir(path.dirname(args.state), { recursive: true });
  await writeFile(args.state, JSON.stringify(state, null, 2));
};
const log = message => console.log(`[${new Date().toISOString().slice(11, 19)}] ${message}`);

class Stop extends Error {}

/** Prices every model call across all baseline runs; stops on an unpriced model or a passed budget. */
const spendSoFar = async () => {
  const calls = [];
  for (const site of Object.values(state.sites)) {
    if (site.runId) {
      calls.push(...(await listModelCalls(client, site.runId)));
    }
  }
  const unpriced = calls.filter(call => costOfCall(call).usd === null);
  if (unpriced.length > 0) {
    throw new Stop(
      `${unpriced.length} model call(s) to a model with no price entry (${[
        ...new Set(unpriced.map(call => call.modelId))
      ].join(", ")}); the budget cannot be enforced.`
    );
  }
  return { summary: summarizeCost(calls), calls };
};

const checkBudget = async label => {
  const { summary } = await spendSoFar();
  state.spentUsd = summary.usd;
  await save();
  log(`spend after ${label}: $${summary.usd.toFixed(2)} of $${budget}`);
  if (summary.usd > budget) {
    throw new Stop(`spend $${summary.usd.toFixed(2)} has passed the $${budget} budget.`);
  }
  return summary;
};

/** Before Generate: the spend so far plus this Generate's projected cost must fit the budget. */
const checkGenerateProjection = async runId => {
  const { summary, calls } = await spendSoFar();
  const plan = await getStageArtifact(client, runId, "plan");
  const components = plan?.components?.length ?? 0;
  const generateCalls = calls.filter(call => call.stage === "generate");
  const perCall =
    generateCalls.length > 0
      ? summarizeCost(generateCalls).usd / generateCalls.length
      : FALLBACK_GENERATE_CALL_USD;
  const projected = components * PROJECTED_CALLS_PER_COMPONENT * perCall;
  log(
    `Generate projection: ${components} component(s) x ${PROJECTED_CALLS_PER_COMPONENT} calls x $${perCall.toFixed(3)} = $${projected.toFixed(2)}; spent $${summary.usd.toFixed(2)}`
  );
  if (summary.usd + projected > budget) {
    throw new Stop(
      `Generate would take spend to about $${(summary.usd + projected).toFixed(2)}, past the $${budget} budget.`
    );
  }
};

const createJob = async site => {
  const data = await client.field(
    "componentExtractionCreateJob",
    `mutation ($data: ComponentExtractionCreateJobInput!) {
            componentExtractionCreateJob(data: $data) { data { id name siteUrl themeEntryId themeVersion pageCap } error { message } } }`,
    {
      data: {
        name: site.jobName,
        siteUrl: site.siteUrl,
        themeEntryId: site.themeEntryId,
        themeVersion: site.themeVersion,
        note: "Pre-demo baseline: automation only, no corrections."
      }
    }
  );
  return data;
};

const assertNoOverrides = async jobId => {
  const overrides =
    (await client.field(
      "componentExtractionListOverrides",
      `query ($jobId: ID!) { componentExtractionListOverrides(jobId: $jobId) { data error { message } } }`,
      { jobId }
    )) ?? [];
  if (Array.isArray(overrides) && overrides.length > 0) {
    throw new Stop(
      `job ${jobId} carries ${overrides.length} override(s); the baseline runs only on jobs with none.`
    );
  }
};

const createRun = jobId =>
  client.field(
    "componentExtractionCreateRun",
    `mutation ($jobId: ID!) { componentExtractionCreateRun(jobId: $jobId, note: "baseline") { data { ${RUN_FIELDS} } error { message } } }`,
    { jobId }
  );

const triggerStage = (runId, stage) =>
  client.field(
    "componentExtractionRunStage",
    `mutation ($runId: ID!, $stage: String!) { componentExtractionRunStage(runId: $runId, stage: $stage) { data { taskId } error { message } } }`,
    { runId, stage }
  );

const entryOf = (run, stage) => run.stages.find(entry => entry.stage === stage);

const waitForStage = async (runId, stage) => {
  const deadline = Date.now() + (STAGE_TIMEOUT_MS[stage] ?? STAGE_TIMEOUT_MS.default);
  let last = "";
  while (Date.now() < deadline) {
    const run = await getRun(client, runId);
    const entry = entryOf(run, stage);
    if (entry?.status === "done") {
      return run;
    }
    if (entry?.status === "failed") {
      throw new Stop(`${stage} failed: ${entry.error ?? "no error recorded"}`);
    }
    if (entry?.status !== last) {
      last = entry?.status;
      log(`  ${stage}: ${last}`);
    }
    await sleep(POLL_MS);
  }
  throw new Stop(`${stage} did not finish within its timeout.`);
};

const runStages = async (siteState, runId) => {
  for (const stage of STAGES) {
    let run = await getRun(client, runId);
    const entry = entryOf(run, stage);
    if (entry?.status === "done") {
      continue;
    }
    if (entry?.status === "failed") {
      throw new Stop(`${stage} is failed on this run: ${entry.error ?? "no error recorded"}`);
    }
    if (stage === "generate") {
      await checkGenerateProjection(runId);
    }
    if (entry?.status !== "running") {
      const started = Date.now();
      await triggerStage(runId, stage);
      siteState.timings[stage] = { triggeredOn: new Date(started).toISOString() };
      await save();
      log(`  ${stage}: triggered`);
    }
    run = await waitForStage(runId, stage);
    const done = entryOf(run, stage);
    siteState.timings[stage] = {
      ...(siteState.timings[stage] ?? {}),
      startedOn: done.startedOn,
      finishedOn: done.finishedOn
    };
    await save();
    if (MODEL_STAGES.has(stage)) {
      await checkBudget(`${siteState.host} ${stage}`);
    }
  }
};

const runRenders = async (siteState, runId) => {
  const generate = await getStageArtifact(client, runId, "generate");
  const expected = new Set((generate?.components ?? []).map(component => component.signature));
  const have = async () => {
    const renders = (await getRenders(client, runId))?.renders ?? [];
    return renders.filter(record => expected.has(record.signature)).length;
  };
  if (expected.size === 0 || (await have()) >= expected.size) {
    return;
  }
  await client.field(
    "componentExtractionRenderComponents",
    `mutation ($runId: ID!) { componentExtractionRenderComponents(runId: $runId) { data { taskId } error { message } } }`,
    { runId }
  );
  log(`  render: triggered for ${expected.size} component(s)`);
  siteState.timings.render = { triggeredOn: new Date().toISOString() };
  const deadline = Date.now() + RENDER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const count = await have();
    if (count >= expected.size) {
      siteState.timings.render.finishedOn = new Date().toISOString();
      await save();
      log(`  render: ${count}/${expected.size} recorded`);
      return;
    }
    await sleep(POLL_MS);
  }
  throw new Stop(`render did not record every component within its timeout.`);
};

try {
  for (const site of config.sites) {
    const host = new URL(site.siteUrl).host;
    if (args.only && args.only !== host) {
      continue;
    }
    const siteState = (state.sites[host] ??= { host, timings: {} });
    log(`${host}`);

    if (!siteState.jobId) {
      if (!site.themeEntryId || !site.themeVersion) {
        throw new Stop(`${host} has no published theme pinned in the config.`);
      }
      const job = await createJob(site);
      siteState.jobId = job.id;
      siteState.job = job;
      await save();
      log(`  job ${job.id} (theme ${job.themeEntryId} v${job.themeVersion})`);
    }
    await assertNoOverrides(siteState.jobId);

    if (!siteState.runId) {
      const run = await createRun(siteState.jobId);
      siteState.runId = run.id;
      await save();
      log(`  run ${run.id}`);
    }

    await runStages(siteState, siteState.runId);
    await runRenders(siteState, siteState.runId);
    siteState.completedOn = new Date().toISOString();
    await save();
  }
  await checkBudget("all sites");
  log("baseline runs complete");
} catch (error) {
  if (error instanceof Stop) {
    state.stopped = { on: new Date().toISOString(), reason: error.message };
    await save();
    log(`STOPPED: ${error.message}`);
    process.exitCode = 2;
  } else {
    throw error;
  }
}
