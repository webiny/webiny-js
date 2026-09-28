/**
 * Renders each composed page against the LOCAL website app, screenshots it beside the source
 * screenshot the pipeline already captured, and writes the pairs out for review.
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
 *     node packages/api-page-composition-poc/scripts/comparePages/index.js
 *
 * Environment: WEBINY_API_URL, WEBINY_API_TOKEN, WEBSITE_URL, CHROME_PATH, OUT_DIR.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readinessScript } from "./readiness.js";
import { buildReport, concern } from "./report.js";

const API = process.env.WEBINY_API_URL ?? "https://d1mp23blxyssy7.cloudfront.net/graphql";
const TOKEN = process.env.WEBINY_API_TOKEN ?? "wat_12345678";
const WEBSITE = process.env.WEBSITE_URL ?? "http://localhost:3000";
const CHROME =
    process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT_DIR = process.env.OUT_DIR ?? path.resolve(process.cwd(), ".page-comparison");

const RUNS = [
    ["parkcityplace", "6ab548f77c4ab700023c79c3#0001"],
    ["2424tulane", "6ab5426e7c4ab700023c79b8#0001"],
    ["71westland", "6ab255401109a6000220f2ad#0001"],
    ["freehill", "6ab2635e514c4400024a20b3#0001"]
];

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

    try {
        for (const [site, runId] of RUNS) {
            const outDir = path.join(OUT_DIR, site);
            await mkdir(outDir, { recursive: true });

            const [map, capture] = await Promise.all([
                gql(`query ($runId: ID!) { pageCompositionPocPageMap(runId: $runId) { data } }`, {
                    runId
                }).then(d => d.pageCompositionPocPageMap?.data),
                artifact(runId, "capture")
            ]);

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
                                await writeFile(path.join(outDir, file), Buffer.from(image));
                                record.composedImage = file;
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

            const compared = pages.filter(p => p.status === "compared").length;
            summary.push({ site, total: pages.length, compared, dir: outDir, pages });
            console.log(
                `${site.padEnd(16)} ${compared}/${pages.length} compared  ->  ${path.join(outDir, "index.html")}`
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
