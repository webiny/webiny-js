import { gzipSync } from "node:zlib";
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
// One page does a desktop + a narrow capture (each up to PAGE_TIMEOUT_MS) plus blob writes; yield with
// this much runway so an in-flight page never straddles the Lambda timeout.
const CAPTURE_SAFETY_MARGIN_SECONDS = 150;

/** Resumable checkpoint: which URLs are done, and the page/failure results accumulated so far. */
interface CaptureCheckpoint {
    nextIndex: number;
    pages: CapturedPage[];
    failed: string[];
}
// Full-page PNGs are unbounded by document height, so downscale to a longest-edge cap before storing.
const SCREENSHOT_MAX_EDGE = 1568;

const NARROW_EVALUATOR = `(() => ({ tree: null, documentHeight: 0, rawDom: "" }))()`;

// `sharp` is a native module provided by a Lambda layer, present only on the background-task runtime
// (where stages execute) — not on the GraphQL Lambda that imports this feature to build its schema.
// So it is loaded lazily, at call time, never at module import. (Same pattern as api-file-manager's
// SharpTransformer.)
const downscalePng = async (image: Uint8Array): Promise<Buffer> => {
    const sharp = (await import("sharp")).default;
    return sharp(image)
        .resize({
            width: SCREENSHOT_MAX_EDGE,
            height: SCREENSHOT_MAX_EDGE,
            fit: "inside",
            withoutEnlargement: true
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

        const session = await this.browserProvider.open();
        try {
            while (checkpoint.nextIndex < total) {
                const index = checkpoint.nextIndex;
                const { url } = discover.urls[index];
                try {
                    checkpoint.pages.push(await this.capturePage(context, session, url, index));
                    await context.progress({
                        message: `Captured ${url}`,
                        current: index + 1,
                        total
                    });
                } catch (error) {
                    // One unreadable page must not lose the crawl — record and continue.
                    checkpoint.failed.push(url);
                    await context.log.error({ message: `Could not capture ${url}.`, error });
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
            degraded: checkpoint.failed
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
