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
import { ImageAssetService } from "~/features/shared/ImageAssetService.js";
import { migrateImages } from "./migrateImages.js";
import { tallyAssets, type AssetOutcome } from "~/domain/assets.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

const DESKTOP = { width: 1440, height: 900 };
const NARROW = { width: 390, height: 844 };
const PAGE_TIMEOUT_MS = 60_000;
/**
 * Per-page ceiling for collected image bytes.
 *
 * Measured, a whole demo site is about 2 MB, so this does not bind there. It exists for the site that
 * behaves differently: it turns an image-heavy page into a recorded unmigrated image rather than a
 * capture that dies of memory pressure, which is the difference between a reported gap and a lost run.
 */
const MAX_IMAGE_BYTES_PER_PAGE = 40 * 1024 * 1024;

const MAX_NODES = 4000;
// One page does a desktop + a narrow capture (each up to PAGE_TIMEOUT_MS) plus blob writes — up to ~130s.
// The margin MUST exceed one page's worst case: the timeout is only checked between pages, so if a page
// starts with less runway than it needs the Lambda is hard-killed mid-page and the stage sticks "running".
const CAPTURE_SAFETY_MARGIN_SECONDS = 200;

const errMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

/** Resumable checkpoint: which URLs are done, and the page/failure results accumulated so far. */
interface CaptureCheckpoint {
    nextIndex: number;
    pages: CapturedPage[];
    failed: CaptureFailure[];
    /**
     * What happened to each image, accumulated across pages.
     *
     * On the checkpoint rather than in a local: this stage pauses and resumes in a fresh invocation
     * when it nears the timeout, and outcomes held in memory would be lost at exactly the point a
     * long crawl needs them.
     */
    assetOutcomes?: AssetOutcome[];
}
// Full-page PNGs are bounded by height only, NOT longest edge: a full-page screenshot is much taller
// than wide, so a longest-edge cap scales by the height and crushes the width — a 1440×5000 page would
// store at ~451px wide, losing two thirds of the horizontal detail the section crops and Segment
// overlays depend on. Instead keep the capture's native width (1440 desktop, 390 narrow — the WIDTH cap
// sits well above both so it never triggers) and bound only pathologically tall pages by height.
const SCREENSHOT_MAX_WIDTH = 2000;
const SCREENSHOT_MAX_HEIGHT = 16000;
// The grid tile is a 3:4 crop of the top of the page (object-cover object-top), so the thumbnail is built
// to match: the top of the page cropped to that aspect at a crisp width. A longest-edge downscale would
// crush a tall full-page screenshot's width to ~140px and render blurry in the ~205px tiles.
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

    constructor(
        private browserProvider: BrowserProvider.Interface,
        private imageAssets: ImageAssetService.Interface
    ) {}

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
        // Resume only an INCOMPLETE checkpoint (a run paused near the Lambda timeout, still mid-crawl). A
        // completed one — nextIndex at total — is not a resume point: it's a prior attempt that finished,
        // and for a failed stage the version does not bump, so a re-run lands on the same checkpoint key.
        // Reloading it would skip the loop and re-report the old result (all failed) without re-capturing.
        const previous = loaded.value;
        const checkpoint: CaptureCheckpoint =
            previous && previous.nextIndex < total
                ? previous
                : { nextIndex: 0, pages: [], failed: [], assetOutcomes: [] };
        // A checkpoint written before this field existed resumes without it.
        checkpoint.assetOutcomes ??= [];

        // An immediate line so the run view shows activity during the (slow) headless-browser launch,
        // before the first page completes.
        await context.progress({
            message: `Launching browser to capture ${total} page(s)…`,
            current: checkpoint.nextIndex,
            total
        });

        const session = await this.browserProvider.open();
        try {
            while (checkpoint.nextIndex < total) {
                const index = checkpoint.nextIndex;
                const { url } = discover.urls[index];
                try {
                    const captured = await this.capturePage(context, session, url, index);
                    checkpoint.pages.push(captured.page);
                    checkpoint.assetOutcomes.push(...captured.assetOutcomes);
                    await context.progress({
                        message: `Captured ${url}`,
                        current: index + 1,
                        total
                    });
                } catch (error) {
                    // One unreadable page must not lose the crawl — record the reason and continue.
                    const reason = errMessage(error);
                    checkpoint.failed.push({ url, reason });
                    await context.log.error({
                        message: `Could not capture ${url}: ${reason}`,
                        error
                    });
                }
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
            // Surface why: with no artifact written, the per-page reasons have nowhere else to show.
            const reasons = [
                ...new Set(checkpoint.failed.map(failure => failure.reason).filter(Boolean))
            ];
            const detail = reasons.length > 0 ? ` — ${reasons.slice(0, 3).join("; ")}` : "";
            return Result.fail(
                new ExtractionValidationError(`no pages could be captured${detail}`)
            );
        }

        const assetOutcomes = checkpoint.assetOutcomes ?? [];
        const outcomesStored = await context.blobs.put(
            `${context.run.id}/capture/assets-v${context.stageVersion}.json`,
            new TextEncoder().encode(JSON.stringify(assetOutcomes)),
            "application/json"
        );
        if (outcomesStored.isFail()) {
            return Result.fail(outcomesStored.error);
        }

        const artifact: CaptureArtifact = {
            pages: checkpoint.pages,
            failed: checkpoint.failed,
            assets: { ...tallyAssets(assetOutcomes), assetOutcomesRef: outcomesStored.value }
        };
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

    private async capturePage(
        context: StageContext,
        session: BrowserProvider.Session,
        url: string,
        index: number
    ): Promise<{ page: CapturedPage; assetOutcomes: AssetOutcome[] }> {
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
            /*
             * Collected from the responses the browser already received, not re-requested later. A CDN
             * can serve a different representation of one URL per request — Cloudinary's `f_auto`
             * returns WebP to Chrome and PNG to a plain server-side fetch — so anything fetching these
             * bytes afterwards would store an image the visitor never saw.
             */
            collectImages: { maxTotalBytes: MAX_IMAGE_BYTES_PER_PAGE, maxConcurrent: 4 },
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

        /*
         * Migrated here, per page, rather than once at the end of the stage: the bytes are in memory
         * now and holding every page's images until the crawl finishes is the memory profile the
         * per-page ceiling exists to avoid. Dedup is what keeps the repetition cheap — a logo on eight
         * pages is uploaded once and referenced eight times.
         */
        const assetOutcomes = await migrateImages(
            this.imageAssets.deps(async message => {
                await context.log.info({ message });
            }),
            desktop.images
        );

        for (const skipped of desktop.skippedImages) {
            /*
             * Recorded, never dropped — but as what it is.
             *
             * A request the browser made as an image whose response is not an image is a beacon, not a
             * picture: measured, 71westland's were Bing analytics endpoints answering 204 with no body
             * and no content-type. There is nothing to migrate and nothing is lost, so they belong
             * with the other third-party chrome the migration leaves alone. Counting them as
             * unmigrated read as twelve lost photographs, which is the opposite of informative.
             *
             * A body over the page ceiling, or one that could not be read, IS content and its absence
             * IS a gap. Those stay unmigrated.
             */
            const detail = `${skipped.reason}${skipped.detail ? `: ${skipped.detail}` : ""}${
                skipped.status ? ` (HTTP ${skipped.status})` : ""
            }`;

            assetOutcomes.push(
                skipped.reason === "not-an-image"
                    ? { kind: "external", sourceUrl: skipped.url, reason: detail }
                    : { kind: "unmigrated", sourceUrl: skipped.url, reason: detail }
            );
        }

        const page: CapturedPage = {
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
                // The late pass's verdict: it ran against the page as photographed.
                overlayRemains: desktop.lateClearance.overlayRemains,
                brokenImages: desktop.result.imagesBroken,
                totalImages: desktop.result.imagesTotal
            },
            overlayClearance: {
                early: {
                    hidden: desktop.earlyClearance.hidden,
                    dismissed: desktop.earlyClearance.dismissed,
                    removed: desktop.earlyClearance.removed,
                    unlockedScroll: desktop.earlyClearance.unlockedScroll
                },
                late: {
                    hidden: desktop.lateClearance.hidden,
                    dismissed: desktop.lateClearance.dismissed,
                    removed: desktop.lateClearance.removed,
                    unlockedScroll: desktop.lateClearance.unlockedScroll
                }
            }
        };

        return { page, assetOutcomes };
    }
}

export const CaptureHandler = StageHandler.createImplementation({
    implementation: CaptureHandlerImpl,
    dependencies: [BrowserProvider, ImageAssetService]
});
