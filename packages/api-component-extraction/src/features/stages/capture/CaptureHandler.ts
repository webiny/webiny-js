import { gzipSync } from "node:zlib";
import sharp from "sharp";
import { Result } from "@webiny/feature/api";
import { BrowserProvider } from "@webiny/site-capture";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    CapturedNode,
    CapturedPage,
    CaptureArtifact,
    DiscoverArtifact
} from "~/domain/artifacts.js";
import { captureEvaluator, type CaptureEvalResult } from "./captureEvaluator.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

const DESKTOP = { width: 1440, height: 900 };
const NARROW = { width: 390, height: 844 };
const PAGE_TIMEOUT_MS = 60_000;
const MAX_NODES = 4000;
// Full-page PNGs are unbounded by document height, so downscale to a longest-edge cap before storing.
const SCREENSHOT_MAX_EDGE = 1568;

const NARROW_EVALUATOR = `(() => ({ tree: null, documentHeight: 0, rawDom: "" }))()`;

const downscalePng = async (image: Uint8Array): Promise<Buffer> =>
    sharp(image)
        .resize({
            width: SCREENSHOT_MAX_EDGE,
            height: SCREENSHOT_MAX_EDGE,
            fit: "inside",
            withoutEnlargement: true
        })
        .png()
        .toBuffer();

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

        const pages: CapturedPage[] = [];
        const failed: string[] = [];

        const session = await this.browserProvider.open();
        try {
            for (let index = 0; index < discover.urls.length; index++) {
                const { url } = discover.urls[index];
                try {
                    pages.push(await this.capturePage(context, session, url, index));
                    await context.log.info({ message: `Captured ${url}.`, data: { index } });
                } catch (error) {
                    // One unreadable page must not lose the crawl — record and continue.
                    failed.push(url);
                    await context.log.error({ message: `Could not capture ${url}.`, error });
                }
            }
        } finally {
            await session.close();
        }

        if (pages.length === 0) {
            return Result.fail(new ExtractionValidationError("no pages could be captured"));
        }

        const artifact: CaptureArtifact = { pages, failed };
        const key = context.artifactKey("pages");
        const written = await context.store.putJson(key, artifact);
        if (written.isFail()) {
            return Result.fail(written.error);
        }

        return Result.ok({
            artifacts: { pages: key },
            counts: { pages: pages.length },
            degraded: failed
        });
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

        // Desktop: tree + raw DOM + full-page screenshot.
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
                        `${base}/screenshot.png`,
                        await downscalePng(image),
                        "image/png"
                    );
                    if (stored.isFail()) {
                        throw new Error(stored.error.message);
                    }
                    screenshotRef = stored.value;
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
                        `${base}/screenshot-narrow.png`,
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
            viewport: { x: 0, y: 0, width: DESKTOP.width, height: DESKTOP.height },
            documentHeight: desktop.result.documentHeight,
            treeRef: treeStored.value,
            screenshotRef,
            rawDomRef: domStored.value,
            narrowScreenshotRef
        };
    }
}

export const CaptureHandler = StageHandler.createImplementation({
    implementation: CaptureHandlerImpl,
    dependencies: [BrowserProvider]
});
