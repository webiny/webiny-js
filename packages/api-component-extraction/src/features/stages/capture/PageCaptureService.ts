import { gzipSync } from "node:zlib";
import { createAbstraction, createImplementation, Result } from "@webiny/feature/api";
import type { BrowserProvider } from "@webiny/site-capture";
import { BlobStore } from "~/domain/stage.js";
import type { CapturedNode, CapturedPage } from "~/domain/artifacts.js";
import { captureEvaluator, type CaptureEvalResult } from "./captureEvaluator.js";
import { ImageAssetService } from "~/features/shared/ImageAssetService.js";
import { migrateImages } from "./migrateImages.js";
import type { AssetOutcome } from "~/domain/assets.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

/**
 * Reading one page: tree, raw DOM, desktop and narrow screenshots, thumbnail, and its images.
 *
 * Extracted from the Capture stage so a second caller can read one page without re-running the crawl.
 * Re-capturing a handful of pages whose screenshots came out wrong — an overlay that survived the
 * clearance pass, a page that timed out — cost a pass over every discovered page, which on a 40-page
 * job is the difference between a usable correction and one nobody makes.
 *
 * The stage and the targeted re-capture must read a page the SAME way, or a re-captured page is not
 * comparable with the ones around it: same viewports, same timeouts, same evaluator, same node cap,
 * same per-page image ceiling. One definition is the only way that stays true.
 */

export const DESKTOP = { width: 1440, height: 900 };
export const NARROW = { width: 390, height: 844 };
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

// A screenshot is NOT downscaled to a longest-edge budget: that would change the width every geometry
// downstream depends on. Instead the capture's native width is kept and only pathologically tall pages
// are bounded by height.
const SCREENSHOT_MAX_WIDTH = 2000;
const SCREENSHOT_MAX_HEIGHT = 16000;
// The grid tile is a 3:4 crop of the top of the page, so the thumbnail is built to match at a crisp
// width. A longest-edge downscale would crush a tall full-page screenshot and render blurry in the tile.
const PAGE_THUMB = { width: 600, height: 800 };

const NARROW_EVALUATOR = `(() => ({ tree: null, documentHeight: 0, rawDom: "" }))()`;

// `sharp` is a native module provided by a Lambda layer, present only on the background-task runtime
// (where stages and tasks execute) — not on the GraphQL Lambda that imports this feature to build its
// schema. So it is loaded lazily, at call time, never at module import.
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

export interface CapturePageInput {
    session: BrowserProvider.Session;
    url: string;
    runId: string;
    /** Position among the run's pages — the blob path segment, so a page keeps its folder. */
    index: number;
    stageVersion: number;
    /**
     * Which re-capture produced this, absent for the stage's own pass.
     *
     * In the blob key, not just the artifact. A re-capture writing over the keys it replaces would be
     * correct in storage and wrong on screen: the admin caches an image by its URL for the session, so
     * the operator would press the button, the page would be read again, and the same stale screenshot
     * would come back. A new key is a new URL, and the run-image route's allowlist is rebuilt from the
     * artifact, so the new ref is servable the moment it is recorded.
     */
    attempt?: number;
    log: (message: string, error?: unknown) => Promise<void>;
}

export interface CapturedPageResult {
    page: CapturedPage;
    assetOutcomes: AssetOutcome[];
}

export interface IPageCaptureService {
    capture(input: CapturePageInput): Promise<Result<CapturedPageResult, ExtractionError>>;
}

export const PageCaptureService = createAbstraction<IPageCaptureService>(
    "ComponentExtraction/PageCaptureService"
);
export namespace PageCaptureService {
    export type Interface = IPageCaptureService;
}

class PageCaptureServiceImpl implements IPageCaptureService {
    constructor(
        private blobs: BlobStore.Interface,
        private imageAssets: ImageAssetService.Interface
    ) {}

    async capture(input: CapturePageInput): Promise<Result<CapturedPageResult, ExtractionError>> {
        try {
            return Result.ok(await this.capturePage(input));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return Result.fail(
                new ExtractionValidationError(`could not capture ${input.url}: ${message}`)
            );
        }
    }

    private async capturePage(input: CapturePageInput): Promise<CapturedPageResult> {
        const { session, url, index, stageVersion, attempt } = input;
        const base = `${input.runId}/capture/page-${index}`;
        // The suffix only appears on a re-capture, so the stage's own keys are unchanged.
        const version = attempt ? `v${stageVersion}-r${attempt}` : `v${stageVersion}`;
        const suffix = attempt ? `-r${attempt}` : "";
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
                    const stored = await this.blobs.put(
                        `${base}/screenshot-${version}.png`,
                        await downscalePng(image),
                        "image/png"
                    );
                    if (stored.isFail()) {
                        throw new Error(stored.error.message);
                    }
                    screenshotRef = stored.value;

                    // Versioned so a re-run's derivative never mixes with the previous version's. A
                    // thumbnail failure must not fail the page.
                    try {
                        const thumb = await this.blobs.put(
                            `${base}/thumbnail-${version}.png`,
                            await thumbnailPng(image),
                            "image/png"
                        );
                        if (thumb.isOk()) {
                            thumbnailRef = thumb.value;
                        }
                    } catch (error) {
                        await input.log(`Could not build the thumbnail for ${url}.`, error);
                    }
                    return stored.value;
                }
            }
        });

        const tree = desktop.result.tree as CapturedNode | null;
        if (!tree) {
            throw new Error("the page yielded no element tree");
        }

        const treeStored = await this.blobs.put(
            `${base}/tree${suffix}.json`,
            new TextEncoder().encode(JSON.stringify(tree)),
            "application/json"
        );
        if (treeStored.isFail()) {
            throw new Error(treeStored.error.message);
        }

        const domStored = await this.blobs.put(
            `${base}/dom${suffix}.html.gz`,
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
                    const stored = await this.blobs.put(
                        `${base}/screenshot-narrow-${version}.png`,
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
        await this.imageAssets.prepare();
        const assetOutcomes = await migrateImages(
            this.imageAssets.deps(async message => {
                await input.log(message);
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

export const PageCaptureServiceImplementation = createImplementation({
    abstraction: PageCaptureService,
    implementation: PageCaptureServiceImpl,
    dependencies: [BlobStore, ImageAssetService]
});
