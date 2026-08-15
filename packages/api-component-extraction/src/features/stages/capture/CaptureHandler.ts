import { gzipSync } from "node:zlib";
import { Result } from "@webiny/feature/api";
import { BrowserProvider } from "@webiny/site-capture";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    CapturedNode,
    CapturedPage,
    CaptureArtifact,
    CaptureFailure,
    DiscoverArtifact
} from "~/domain/artifacts.js";
import { captureEvaluator, type CaptureEvalResult } from "./captureEvaluator.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

const DESKTOP = { width: 1440, height: 900 };
const NARROW = { width: 390, height: 844 };
const PAGE_TIMEOUT_MS = 60_000;
const MAX_NODES = 4000;
// One page does a desktop + a narrow capture (each up to PAGE_TIMEOUT_MS) plus blob writes — up to ~130s.
// The margin MUST exceed one page's worst case: the timeout is only checked between pages, so if a page
// starts with less runway than it needs the Lambda is hard-killed mid-page and the stage sticks "running".
const CAPTURE_SAFETY_MARGIN_SECONDS = 200;
// Recycle the headless browser every N captured pages. Each page is closed after capture, but the browser
// process itself accumulates memory, handles and network-stack pressure across a long crawl and eventually
// refuses new requests (net::ERR_INSUFFICIENT_RESOURCES) — a fresh browser resets that.
const PAGES_PER_BROWSER = 10;

const errMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

/** Resumable checkpoint: which URLs are done, and the page/failure results accumulated so far. */
interface CaptureCheckpoint {
    nextIndex: number;
    pages: CapturedPage[];
    failed: CaptureFailure[];
}
// Full-page PNGs are bounded by height only, NOT longest edge: a full-page screenshot is much taller
// than wide, so a longest-edge cap scales by the height and crushes the width — a 1440×5000 page would
// store at ~451px wide, losing two thirds of the horizontal detail the section crops and Segment
// overlays depend on. Instead keep the capture's native width (1440 desktop, 390 narrow — the WIDTH cap
// sits well above both so it never triggers) and bound only pathologically tall pages by height.
const SCREENSHOT_MAX_WIDTH = 2000;
const SCREENSHOT_MAX_HEIGHT = 16000;
// The grid tile is a 3:4 crop of the top of the page (object-cover object-top), so the thumbnail is built
// to match: the top of the page cropped to 3:4 at a crisp width, not a longest-edge downscale (which for
// a tall full-page screenshot crushes the width to ~140px and renders blurry). The full-page image is
// still served only when a tile is opened.
const PAGE_THUMB = { width: 600, height: 800 };

const NARROW_EVALUATOR = `(() => ({ tree: null, documentHeight: 0, rawDom: "" }))()`;

// `sharp` is a native module provided by a Lambda layer, present only on the background-task runtime
// (where stages execute) — not on the GraphQL Lambda that imports this feature to build its schema.
// So it is loaded lazily, at call time, never at module import. (Same pattern as api-file-manager's
// SharpTransformer.)
const downscalePng = async (image: Uint8Array): Promise<Buffer> => {
    const sharp = (await import("sharp")).default;
    return sharp(image)
        .resize({
            width: SCREENSHOT_MAX_WIDTH,
            height: SCREENSHOT_MAX_HEIGHT,
            fit: "inside",
            withoutEnlargement: true
        })
        .png()
        .toBuffer();
};

/** The grid thumbnail: the top of the page cropped to the tile's 3:4 aspect at a crisp width. */
const thumbnailPng = async (image: Uint8Array): Promise<Buffer> => {
    const sharp = (await import("sharp")).default;
    return sharp(image)
        .resize({
            width: PAGE_THUMB.width,
            height: PAGE_THUMB.height,
            fit: "cover",
            position: "top"
        })
        .png()
        .toBuffer();
};

/**
 * Capture — read each discovered page with the shared browser and stream its artifacts to S3 as the
 * page completes, never accumulating bytes across pages. Per page: a pruned element tree (working
 * artifact), a downscaled full-page desktop screenshot, the gzip-compressed raw DOM (cold artifact),
 * and a narrow-width full-page screenshot. A page that fails is recorded and skipped (degraded), not
 * fatal — only an empty capture fails the stage.
 */
class CaptureHandlerImpl implements StageHandler.Interface {
    readonly stage = "capture" as const;

    constructor(private browserProvider: BrowserProvider.Interface) {}

    async execute(context: StageContext): Promise<Result<StageOutcome, ExtractionError>> {
        const discoverRef = context.upstream.urls;
        if (!discoverRef) {
            return Result.fail(new ExtractionValidationError("no discovered URLs to capture"));
        }
        const discoverResult = await context.store.getJson<DiscoverArtifact>(discoverRef);
        if (discoverResult.isFail()) {
            return Result.fail(discoverResult.error);
        }
        const discover = discoverResult.value;
        if (!discover || discover.urls.length === 0) {
            return Result.fail(new ExtractionValidationError("the discover artifact has no URLs"));
        }

        const total = discover.urls.length;

        // Resume from the checkpoint if this is a continuation; start fresh otherwise.
        const checkpointKey = context.artifactKey("checkpoint");
        const loaded = await context.store.getJson<CaptureCheckpoint>(checkpointKey);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const checkpoint: CaptureCheckpoint = loaded.value ?? {
            nextIndex: 0,
            pages: [],
            failed: []
        };

        // An immediate line so the run view shows activity during the (slow) headless-browser launch,
        // before the first page completes.
        await context.progress({
            message: `Launching browser to capture ${total} page(s)…`,
            current: checkpoint.nextIndex,
            total
        });

        let session = await this.browserProvider.open();
        let pagesOnBrowser = 0;
        try {
            while (checkpoint.nextIndex < total) {
                const index = checkpoint.nextIndex;
                const { url } = discover.urls[index];

                // Proactively recycle the browser so accumulated resources don't build to exhaustion.
                if (pagesOnBrowser >= PAGES_PER_BROWSER) {
                    session = await this.recycle(session);
                    pagesOnBrowser = 0;
                }

                try {
                    let page: CapturedPage;
                    try {
                        page = await this.capturePage(context, session, url, index);
                    } catch (firstError) {
                        // Recover once on a fresh browser — a resource exhaustion (ERR_INSUFFICIENT_
                        // RESOURCES) or a wedged renderer usually captures fine with a clean pool.
                        await context.log.info({
                            message: `Retrying ${url} on a fresh browser after: ${errMessage(firstError)}`
                        });
                        session = await this.recycle(session);
                        pagesOnBrowser = 0;
                        page = await this.capturePage(context, session, url, index);
                    }
                    checkpoint.pages.push(page);
                    await context.progress({
                        message: `Captured ${url}`,
                        current: index + 1,
                        total
                    });
                } catch (error) {
                    // Both attempts failed — record the reason and continue; one page must not lose the crawl.
                    const reason = errMessage(error);
                    checkpoint.failed.push({ url, reason });
                    await context.log.error({
                        message: `Could not capture ${url}: ${reason}`,
                        error
                    });
                }
                pagesOnBrowser++;
                checkpoint.nextIndex++;
                const saved = await context.store.putJson(checkpointKey, checkpoint);
                if (saved.isFail()) {
                    return Result.fail(saved.error);
                }

                // Near the timeout with pages remaining: checkpoint is already saved, so yield and let
                // the runner continue this stage in a fresh invocation.
                if (
                    checkpoint.nextIndex < total &&
                    context.isCloseToTimeout(CAPTURE_SAFETY_MARGIN_SECONDS)
                ) {
                    await context.progress({
                        message: `Captured ${checkpoint.nextIndex}/${total} pages; pausing to continue in a new run.`,
                        current: checkpoint.nextIndex,
                        total
                    });
                    return Result.ok({
                        artifacts: {},
                        counts: { pages: checkpoint.pages.length },
                        more: true
                    });
                }
            }
        } finally {
            await session.close();
        }

        if (checkpoint.pages.length === 0) {
            return Result.fail(new ExtractionValidationError("no pages could be captured"));
        }

        const artifact: CaptureArtifact = { pages: checkpoint.pages, failed: checkpoint.failed };
        const key = context.artifactKey("pages");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        return Result.ok({
            artifacts: { pages: key },
            counts: { pages: checkpoint.pages.length },
            degraded: checkpoint.failed.map(failure => failure.url)
        });
    }

    /** Close the current browser and open a fresh one, releasing accumulated Chromium resources. */
    private async recycle(session: BrowserProvider.Session): Promise<BrowserProvider.Session> {
        try {
            await session.close();
        } catch {
            // A browser that won't close cleanly is being discarded anyway.
        }
        return this.browserProvider.open();
    }

    private async capturePage(
        context: StageContext,
        session: BrowserProvider.Session,
        url: string,
        index: number
    ): Promise<CapturedPage> {
        const base = `${context.run.id}/capture/page-${index}`;
        let screenshotRef = "";
        let narrowScreenshotRef = "";
        let thumbnailRef = "";

        // Desktop: tree + raw DOM + full-page screenshot (plus a small grid thumbnail derived from it).
        const desktop = await session.capture<CaptureEvalResult>({
            url,
            viewportWidth: DESKTOP.width,
            viewportHeight: DESKTOP.height,
            timeoutMs: PAGE_TIMEOUT_MS,
            evaluate: captureEvaluator({ maxNodes: MAX_NODES }),
            screenshots: {
                requests: [{ label: "full-page", crop: "full-page" }],
                write: async image => {
                    const stored = await context.blobs.put(
                        `${base}/screenshot-v${context.stageVersion}.png`,
                        await downscalePng(image),
                        "image/png"
                    );
                    if (stored.isFail()) {
                        throw new Error(stored.error.message);
                    }
                    screenshotRef = stored.value;

                    // Grid thumbnail, versioned so a Capture re-run's derivative never mixes with the
                    // previous version's. A thumbnail failure must not fail the page.
                    try {
                        const thumb = await context.blobs.put(
                            `${base}/thumbnail-v${context.stageVersion}.png`,
                            await thumbnailPng(image),
                            "image/png"
                        );
                        if (thumb.isOk()) {
                            thumbnailRef = thumb.value;
                        }
                    } catch (error) {
                        await context.log.error({
                            message: `Could not build the thumbnail for ${url}.`,
                            error
                        });
                    }
                    return stored.value;
                }
            }
        });

        const tree = desktop.result.tree as CapturedNode | null;
        if (!tree) {
            throw new Error("the page yielded no element tree");
        }

        const treeStored = await context.blobs.put(
            `${base}/tree.json`,
            new TextEncoder().encode(JSON.stringify(tree)),
            "application/json"
        );
        if (treeStored.isFail()) {
            throw new Error(treeStored.error.message);
        }

        const domStored = await context.blobs.put(
            `${base}/dom.html.gz`,
            gzipSync(Buffer.from(desktop.result.rawDom, "utf8")),
            "application/gzip"
        );
        if (domStored.isFail()) {
            throw new Error(domStored.error.message);
        }

        // Narrow: full-page screenshot only.
        await session.capture<CaptureEvalResult>({
            url,
            viewportWidth: NARROW.width,
            viewportHeight: NARROW.height,
            timeoutMs: PAGE_TIMEOUT_MS,
            evaluate: NARROW_EVALUATOR,
            screenshots: {
                requests: [{ label: "full-page-narrow", crop: "full-page" }],
                write: async image => {
                    const stored = await context.blobs.put(
                        `${base}/screenshot-narrow-v${context.stageVersion}.png`,
                        await downscalePng(image),
                        "image/png"
                    );
                    if (stored.isFail()) {
                        throw new Error(stored.error.message);
                    }
                    narrowScreenshotRef = stored.value;
                    return stored.value;
                }
            }
        });

        return {
            url,
            finalUrl: desktop.finalUrl,
            title: desktop.result.title,
            viewport: { x: 0, y: 0, width: DESKTOP.width, height: DESKTOP.height },
            documentHeight: desktop.result.documentHeight,
            treeRef: treeStored.value,
            screenshotRef,
            rawDomRef: domStored.value,
            narrowScreenshotRef,
            thumbnailRef,
            warnings: {
                consentPresent: desktop.result.consentPresent,
                brokenImages: desktop.result.imagesBroken,
                totalImages: desktop.result.imagesTotal
            }
        };
    }
}

export const CaptureHandler = StageHandler.createImplementation({
    implementation: CaptureHandlerImpl,
    dependencies: [BrowserProvider]
});
