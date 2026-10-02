import { Result } from "@webiny/feature/api";
import { BrowserProvider } from "@webiny/site-capture";
import { StageHandler, type StageContext, type StageOutcome } from "~/domain/stage.js";
import type {
    CapturedPage,
    CaptureArtifact,
    CaptureFailure,
    DiscoverArtifact
} from "~/domain/artifacts.js";
import { PageCaptureService } from "./PageCaptureService.js";
import { tallyAssets, type AssetOutcome } from "~/domain/assets.js";
import { ExtractionValidationError, type ExtractionError } from "~/domain/errors.js";

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
        private pageCapture: PageCaptureService.Interface
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
                    const result = await this.pageCapture.capture({
                        session,
                        url,
                        runId: context.run.id,
                        index,
                        stageVersion: context.stageVersion,
                        log: async (message, error) => {
                            await context.log.error({ message, error });
                        }
                    });
                    if (result.isFail()) {
                        throw new Error(result.error.message);
                    }
                    const captured = result.value;
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
}

export const CaptureHandler = StageHandler.createImplementation({
    implementation: CaptureHandlerImpl,
    dependencies: [BrowserProvider, PageCaptureService]
});
