import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { BrowserProvider } from "@webiny/site-capture";
import { RECAPTURE_PAGES_TASK_ID, stagesAfter } from "~/constants.js";
import { RunRepository } from "~/domain/abstractions.js";
import { StageArtifactStore } from "~/domain/stage.js";
import { stageEntry, markStaleFrom } from "~/domain/ledger.js";
import type { CaptureArtifact, CapturedPage, CaptureFailure } from "~/domain/artifacts.js";
import { PageCaptureService } from "./PageCaptureService.js";

export interface RecaptureTaskInput {
    runId: string;
    /** The page URLs to read again, as recorded on the capture artifact. */
    urls: string[];
    /**
     * Identifies one press of the button, so a continuation can tell itself from a fresh press.
     *
     * The same reason the render task carries one: a continuation reuses the input, so it reuses this,
     * while a new press mints a new one. Without it a completed pass short-circuits every later press
     * — the checkpoint reports itself finished and the button visibly does nothing.
     */
    attempt?: string;
}

export interface RecaptureTaskProgress {
    current: number;
    total: number;
    message: string;
}

export interface RecaptureTaskOutput {
    progress?: RecaptureTaskProgress;
}

/** Resumable checkpoint: how far through the selected pages, and what came back. */
interface RecaptureCheckpoint {
    nextIndex: number;
    captured: CapturedPage[];
    failed: CaptureFailure[];
    attempt?: string;
    /** Which re-capture this is for the run, so each one's blobs get their own keys. */
    round: number;
}

// One page is a desktop plus a narrow capture plus blob writes — up to ~130s. The margin must exceed
// one page's worst case, since the timeout is only checked between pages.
const RECAPTURE_SAFETY_MARGIN_SECONDS = 200;

type RunParams = TaskHandler.RunParams<RecaptureTaskInput, RecaptureTaskOutput>;
type RunResult = Promise<TaskHandler.Result<RecaptureTaskInput, RecaptureTaskOutput>>;

/**
 * Reads selected pages again and replaces them in the Capture artifact.
 *
 * Not a stage. A capture goes wrong one page at a time — a consent overlay that survived the clearance
 * pass, a page that timed out, a hero that had not finished loading — and the only remedy was re-running
 * Capture over every discovered page. On a 40-page job that is roughly an hour to fix one screenshot,
 * so in practice the bad page stayed and flowed into Segment.
 *
 * Each selected page is read through the same `PageCaptureService` the stage uses, so a replaced page
 * is comparable with the ones around it. A page that fails is recorded as a failure and the page it
 * replaces is LEFT in place: a re-capture that cannot read the page should not also destroy the only
 * capture of it.
 *
 * Everything from Segment onwards is marked stale, because the sections, clusters and components
 * downstream were derived from the screenshots this just replaced.
 */
class RecapturePagesTaskHandlerImpl implements TaskHandler.Interface<
    RecaptureTaskInput,
    RecaptureTaskOutput
> {
    constructor(
        readonly runRepository: RunRepository.Interface,
        readonly artifactStore: StageArtifactStore.Interface,
        readonly browserProvider: BrowserProvider.Interface,
        readonly pageCapture: PageCaptureService.Interface
    ) {}

    async run({ input, controller }: RunParams): RunResult {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }
        const log = controller.logger;

        const runResult = await this.runRepository.get(input.runId);
        if (runResult.isFail()) {
            return controller.response.error(runResult.error.message);
        }
        const run = runResult.value;

        const capture = stageEntry(run.stages, "capture");
        const pagesKey = capture?.artifacts.pages;
        if (!capture || (capture.status !== "done" && capture.status !== "stale") || !pagesKey) {
            return controller.response.error("Capture has not produced pages to re-capture.");
        }

        const artifactResult = await this.artifactStore.getJson<CaptureArtifact>(pagesKey);
        if (artifactResult.isFail() || !artifactResult.value) {
            return controller.response.error("The capture artifact could not be read.");
        }
        const artifact = artifactResult.value;

        /*
         * Only pages this run actually captured, and in the artifact's own order.
         *
         * Taking the caller's order would renumber the pages: the blob path is `page-${index}`, and an
         * index that means something different from one run to the next makes the stored artifacts
         * unreadable against the run that produced them.
         */
        const requested = new Set(input.urls);
        const targets = artifact.pages
            .map((page, index) => ({ page, index }))
            .filter(entry => requested.has(entry.page.url));

        if (targets.length === 0) {
            return controller.response.error(
                "None of the selected pages are in this run's capture artifact."
            );
        }

        const checkpointKey = `${input.runId}/recapture/checkpoint-v${capture.stageVersion}`;
        const loaded = await this.artifactStore.getJson<RecaptureCheckpoint>(checkpointKey);
        const existing = loaded.isOk() ? loaded.value : null;
        // Continue only a checkpoint belonging to THIS press; a new press starts over.
        const checkpoint: RecaptureCheckpoint =
            existing && existing.attempt === input.attempt
                ? existing
                : {
                      nextIndex: 0,
                      captured: [],
                      failed: [],
                      attempt: input.attempt,
                      round: (existing?.round ?? 0) + 1
                  };

        const total = targets.length;
        const session = await this.browserProvider.open();

        try {
            while (checkpoint.nextIndex < total) {
                const { page, index } = targets[checkpoint.nextIndex];

                const result = await this.pageCapture.capture({
                    session,
                    url: page.url,
                    runId: run.id,
                    index,
                    stageVersion: capture.stageVersion,
                    attempt: checkpoint.round,
                    log: async (message, error) => {
                        await log.error({
                            message: error ? `${message} ${String(error)}` : message
                        });
                    }
                });

                if (result.isOk()) {
                    checkpoint.captured.push(result.value.page);
                } else {
                    checkpoint.failed.push({ url: page.url, reason: result.error.message });
                    await log.error({
                        message: `Could not re-capture ${page.url}: ${result.error.message}`
                    });
                }

                checkpoint.nextIndex++;
                const saved = await this.artifactStore.putJson(checkpointKey, checkpoint);
                if (saved.isFail()) {
                    return controller.response.error(saved.error.message);
                }
                await controller.state.updateOutput({
                    progress: {
                        current: checkpoint.nextIndex,
                        total,
                        message: `Re-captured ${checkpoint.nextIndex}/${total} page(s).`
                    }
                });

                if (
                    checkpoint.nextIndex < total &&
                    controller.runtime.isCloseToTimeout(RECAPTURE_SAFETY_MARGIN_SECONDS)
                ) {
                    return controller.response.continue(input, { seconds: 1 });
                }
            }
        } finally {
            await session.close();
        }

        /*
         * Replace in place. A page that failed to re-capture keeps the capture it already had — the
         * point of the button is to improve a page, and losing the only screenshot of it because the
         * second read timed out is a worse outcome than the one being corrected.
         */
        const replacements = new Map(checkpoint.captured.map(page => [page.url, page]));
        const pages = artifact.pages.map(page => replacements.get(page.url) ?? page);
        // A page that now reads cleanly is no longer a capture failure.
        const recovered = new Set(checkpoint.captured.map(page => page.url));
        const failed = (artifact.failed ?? []).filter(failure => !recovered.has(failure.url));

        const written = await this.artifactStore.putJson(pagesKey, {
            ...artifact,
            pages,
            failed
        } satisfies CaptureArtifact);
        if (written.isFail()) {
            return controller.response.error(written.error.message);
        }

        // Everything downstream was derived from the screenshots just replaced.
        const downstream = stagesAfter("capture")[0];
        if (downstream) {
            await this.runRepository.update(run.id, {
                stages: markStaleFrom(run.stages, downstream)
            });
        }

        const ok = checkpoint.captured.length;
        await log.info({
            message: `Re-captured ${ok}/${total} page(s)${
                checkpoint.failed.length
                    ? `; ${checkpoint.failed.length} kept their previous capture`
                    : ""
            }.`
        });
        return controller.response.done({});
    }
}

const RecapturePagesTaskHandler = TaskHandler.createImplementation({
    implementation: RecapturePagesTaskHandlerImpl,
    dependencies: [RunRepository, StageArtifactStore, BrowserProvider, PageCaptureService]
});

class RecapturePagesTaskImpl implements TaskDefinition.Interface<
    RecaptureTaskInput,
    RecaptureTaskOutput
> {
    readonly id = RECAPTURE_PAGES_TASK_ID;
    readonly title = "Component extraction — re-capture pages";
    readonly description = "Reads selected pages again and replaces them in the capture artifact.";
    readonly maxIterations = 30;
    readonly isPrivate = false;
    readonly databaseLogs = true;

    readonly handler = RecapturePagesTaskHandler;
}

export const RecapturePagesTask = TaskDefinition.createImplementation({
    implementation: RecapturePagesTaskImpl,
    dependencies: []
});
