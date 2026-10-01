/**
 * Renders each composed page against the LOCAL website app, screenshots it beside the source
 * screenshot the pipeline already captured, writes the pairs out for review, and uploads the
 * composed half so the admin can show the comparison.
 *
 * **A local script, not a pipeline stage, and deliberately so.** A Lambda cannot reach the developer's
 * machine. In a `webiny watch` session the handler runs locally, so a fetch to localhost would resolve
 * there and fail the moment the same code ran deployed — the "correct in the repo, broken in the
 * environment" failure this project has already hit twice. When the website app is deployed somewhere
 * a Lambda can reach, the readiness script, the viewport matching and the report layout move into a
 * stage unchanged; only this driver is throwaway.
 *
 * Usage, with the website app running:
 *
 *     # the four demo runs
 *     node packages/api-page-composition-poc/scripts/comparePages/index.js
 *
 *     # one run, or several, by id
 *     node packages/api-page-composition-poc/scripts/comparePages/index.js '<runId>' '<runId>'
 *     RUNS='<runId>,<runId>' node packages/api-page-composition-poc/scripts/comparePages/index.js
 *
 * Quote the run id: it contains a `#`, which a shell treats as the start of a comment.
 *
 * Environment: WEBINY_API_URL, WEBINY_API_TOKEN, WEBSITE_URL, CHROME_PATH, OUT_DIR, RUNS.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readinessScript } from "./readiness.js";
import { buildReport, concern } from "./report.js";
import { uploadComposedCapture } from "./upload.js";
import { assertWebsiteServesRun } from "./preflight.js";

const API = process.env.WEBINY_API_URL ?? "https://d1mp23blxyssy7.cloudfront.net/graphql";
const TOKEN = process.env.WEBINY_API_TOKEN ?? "wat_12345678";
const WEBSITE = process.env.WEBSITE_URL ?? "http://localhost:3000";
const CHROME =
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT_DIR = process.env.OUT_DIR ?? path.resolve(process.cwd(), ".page-comparison");

/**
 * The demo collection, used when no run is named.
 *
 * Kept as the default because comparing all four is the common case, but it is only a default: pass
 * run ids as arguments, or in RUNS, to compare any other run. A harness that could only ever look at
 * four hardcoded runs would be a demo script rather than a tool.
 */
const DEFAULT_RUNS = [
    "6ab548f77c4ab700023c79c3#0001",
    "6ab5426e7c4ab700023c79b8#0001",
    "6ab255401109a6000220f2ad#0001",
    "6ab2635e514c4400024a20b3#0001"
];

const REQUESTED_RUNS = (() => {
    const fromArgs = process.argv.slice(2).filter(value => !value.startsWith("-"));
    if (fromArgs.length > 0) {
        return fromArgs;
    }
    const fromEnv = (process.env.RUNS ?? "")
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);
    return fromEnv.length > 0 ? fromEnv : DEFAULT_RUNS;
})();

const REPO = path.resolve(import.meta.dirname, "../../../..");

const gql = async (query, variables) => {
    const res = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    if (json.errors) {
        throw new Error(JSON.stringify(json.errors).slice(0, 300));
    }
    return json.data;
};

/**
 * A short label for a run, for the output directory and the console.
 *
 * Resolved from the job name rather than written beside the run id, so naming a run on the command
 * line needs nothing but the id. Falls back to the id: a label is a convenience, and failing to get
 * one must not stop the comparison.
 */
const runLabel = async runId => {
    try {
        const run = await gql(
            `query ($runId: ID!) {
                componentExtractionGetRun(runId: $runId) { data { jobId runNumber } error { message } }
            }`,
            { runId }
        );
        const jobId = run.componentExtractionGetRun?.data?.jobId;
        if (!jobId) {
            return runId;
        }
        const job = await gql(
            `query ($jobId: ID!) { componentExtractionGetJob(jobId: $jobId) { data { name } } }`,
            { jobId }
        );
        const name = job.componentExtractionGetJob?.data?.name;
        return name ? slug(name) : runId;
    } catch {
        return runId;
    }
};

const artifact = async (runId, stage) => {
    const d = await gql(
        `query ($runId: ID!, $stage: String!) {
            componentExtractionGetStageArtifact(runId: $runId, stage: $stage) { data }
        }`,
        { runId, stage }
    );
    const raw = d.componentExtractionGetStageArtifact.data;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
};

/**
 * The source screenshot the pipeline already took, from the auth-gated run-image route.
 *
 * Re-crawling the customer's site to get it would be both slower and less honest: this is the image
 * the pipeline itself worked from, so a disagreement between the pair is a disagreement about the
 * migration rather than about two different visits to a live site.
 */
const fetchSourceScreenshot = async (runId, ref) => {
    const url = `${API.replace(/\/graphql$/, "")}/_webiny/component-extraction/run/${encodeURIComponent(runId)}/image?ref=${encodeURIComponent(ref)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) {
        throw new Error(`source screenshot ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
};

const slug = value =>
    value
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "home";

const main = async () => {
    const { createChromiumBrowserProvider } = await import(
        `${REPO}/packages/site-capture/dist/browser/ChromiumBrowserProvider.js`
    );

    const provider = createChromiumBrowserProvider({
        executablePath: CHROME,
        // The layer's defaults are shaped for a Lambda sandbox and wrong for a desktop Chrome.
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"]
    });

    const session = await provider.open();
    const summary = [];

    // Named up front, because the screenshots are only evidence about the app they came from.
    console.log(
        `comparing ${REQUESTED_RUNS.length} run(s) against ${WEBSITE}\n` +
            REQUESTED_RUNS.map(runId => `   ${runId}`).join("\n") +
            "\n"
    );

    try {
        const runs = [];
        for (const runId of REQUESTED_RUNS) {
            runs.push([await runLabel(runId), runId]);
        }

        for (const [site, runId] of runs) {
            const outDir = path.join(OUT_DIR, site);
            await mkdir(outDir, { recursive: true });

            const [map, capture] = await Promise.all([
                gql(`query ($runId: ID!) { pageCompositionPocPageMap(runId: $runId) { data } }`, {
                    runId
                }).then(d => d.pageCompositionPocPageMap?.data),
                artifact(runId, "capture")
            ]);

            const preflight = await assertWebsiteServesRun({ website: WEBSITE, site, map, gql });
            if (!preflight.checked) {
                console.log(`${site.padEnd(16)} not preflighted: ${preflight.note}`);
            }

            const screenshotByUrl = new Map(
                (capture?.pages ?? []).map(page => [
                    page.url,
                    { ref: page.screenshotRef, viewport: page.viewport }
                ])
            );

            const pages = [];

            for (const entry of map?.pages ?? []) {
                const source = screenshotByUrl.get(entry.normalizedUrl);
                const record = {
                    path: entry.path,
                    sourceUrl: entry.normalizedUrl,
                    title: entry.title,
                    signals: entry.signals,
                    status: "compared",
                    reason: ""
                };

                if (!entry.pageId) {
                    record.status = "not created";
                    record.reason = "the composition recorded no Website Builder page for this URL";
                    pages.push(record);
                    continue;
                }

                // The source image first: cheap, and a page with no source is not worth rendering.
                if (source?.ref) {
                    try {
                        const bytes = await fetchSourceScreenshot(runId, source.ref);
                        const file = `${slug(entry.path)}-source.png`;
                        await writeFile(path.join(outDir, file), bytes);
                        record.sourceImage = file;
                    } catch (error) {
                        record.sourceError = String(error.message).slice(0, 80);
                    }
                }

                const width = source?.viewport?.width ?? 1440;
                const height = source?.viewport?.height ?? 900;
                record.viewportWidth = width;

                let result;
                try {
                    result = await session.capture({
                        url: `${WEBSITE}${entry.path}`,
                        viewportWidth: width,
                        viewportHeight: height,
                        timeoutMs: 120000,
                        // Readiness is decided in-page, and the screenshots happen after it.
                        evaluate: readinessScript(),
                        screenshots: {
                            requests: [{ label: "full-page", crop: "full-page" }],
                            write: async image => {
                                const file = `${slug(entry.path)}-migrated.png`;
                                const bytes = Buffer.from(image);
                                await writeFile(path.join(outDir, file), bytes);
                                record.composedImage = file;
                                // Held for the upload below and dropped once the site is done, so
                                // the run's peak memory is one site's screenshots rather than four.
                                record.composedBytes = bytes;
                                return file;
                            }
                        }
                    });
                } catch (error) {
                    record.status = "render failed";
                    record.reason = String(error.message).slice(0, 160);
                    pages.push(record);
                    continue;
                }

                record.rendered = result.result;

                /*
                 * A path several runs claim serves whichever composed last, so some pages are not
                 * reachable at their own address. Recorded with the reason rather than skipped: a
                 * comparison tool that hides a composition defect is worse than no tool.
                 */
                if (entry.title && result.result?.title && result.result.title !== entry.title) {
                    record.status = "unreachable";
                    record.reason = `this path serves "${result.result.title}" — another run's page claims it, and the winner is whichever composed last`;
                    record.composedImage = undefined;
                    // The bytes are a photograph of a different run's page. Uploading them would put
                    // a confident, wrong image in the admin, which is worse than an absent one.
                    record.composedBytes = undefined;
                }

                pages.push(record);
            }

            // Most likely to be wrong first: lowest text coverage, then the biggest shortfall in
            // placed sections. A reviewer with limited attention should spend it at the top.
            pages.sort((a, b) => concern(a).rank - concern(b).rank);

            const html = buildReport({
                site,
                runId,
                pages,
                capturedAt: new Date().toISOString()
            });
            await writeFile(path.join(outDir, "index.html"), html);

            /*
             * The viewport every page was rendered at. Taken from the pages themselves rather than
             * from a constant: the harness matches each page to the width its source was captured at,
             * so a mismatch here would mean the two halves of a comparison were photographed
             * differently, and that belongs in the record rather than in a comment.
             */
            const widths = [...new Set(pages.map(p => p.viewportWidth).filter(Boolean))];
            const viewportWidth = widths[0] ?? 1440;

            let upload;
            try {
                upload = await uploadComposedCapture({
                    gql,
                    runId,
                    pages,
                    viewportWidth
                });
            } catch (error) {
                upload = { error: String(error.message).slice(0, 160) };
            }

            // Dropped as soon as the site is uploaded; otherwise four sites of full-page screenshots
            // accumulate for the length of the run.
            for (const page of pages) {
                page.composedBytes = undefined;
            }

            const compared = pages.filter(p => p.status === "compared").length;
            summary.push({
                site,
                total: pages.length,
                compared,
                dir: outDir,
                pages,
                upload,
                widths
            });
            console.log(
                `${site.padEnd(16)} ${compared}/${pages.length} compared  ->  ${path.join(outDir, "index.html")}`
            );
            console.log(
                upload.error
                    ? `${"".padEnd(16)} upload FAILED: ${upload.error}`
                    : `${"".padEnd(16)} uploaded ${upload.uploaded}, skipped ${upload.skipped}, against compose version ${upload.composeVersion}` +
                          (widths.length > 1
                              ? `  (mixed viewport widths: ${widths.join(", ")})`
                              : "")
            );
        }
    } finally {
        await session.close();
    }

    console.log("\nnot compared, with the reason:");
    for (const entry of summary) {
        for (const page of entry.pages.filter(p => p.status !== "compared")) {
            console.log(
                `   ${entry.site.padEnd(16)} ${page.path.padEnd(46)} ${page.status}: ${page.reason.slice(0, 80)}`
            );
        }
    }
};

await main();
