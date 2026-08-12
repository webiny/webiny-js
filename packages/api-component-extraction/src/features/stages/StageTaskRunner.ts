// Pulls in the `TaskController` augmentation so `controller.response`/`logger`/`runtime` exist — the
// same side-effect import theme extraction relies on.
import "@webiny/background-tasks/api/types.js";
import { createAbstraction, createImplementation } from "@webiny/feature/api";
import {
    TaskDefinition,
    type IResponseError
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/features/SendToIdentity/abstractions.js";
import { JobRepository, RunLock, RunRepository } from "~/domain/abstractions.js";
import {
    BlobStore,
    StageArtifactStore,
    StageHandler,
    STAGE_DONE_ACTION,
    STAGE_FAILED_ACTION,
    STAGE_PROGRESS_ACTION,
    type StageProgressPayload
} from "~/domain/stage.js";
import {
    markStageDone,
    markStageFailed,
    markStageRunning,
    stageEntry,
    withStageTaskId
} from "~/domain/ledger.js";
import { previousStage, stageArtifactKey, type Stage } from "~/constants.js";

export interface StageTaskInput {
    runId: string;
    [key: string]: string | undefined;
}

/** The live progress snapshot the runner writes to the task output — the latest counter + message. */
export interface StageProgressOutput {
    stage: string;
    current: number;
    total: number;
    message: string;
}

/** One line of the stage's activity trail, accumulated in the task output. */
export interface StageActivityEntry {
    message: string;
    current?: number;
    total?: number;
    at: string;
}

/**
 * The task output. `activity` is the running trail the admin reads back — kept here rather than in the
 * background-task LOG because that log replaces its items on every write (only the last survives), so it
 * can't hold a trail. The output is a JSON field that round-trips whole, and we always write the full
 * (bounded) array, so it accumulates correctly.
 */
export interface StageTaskOutput {
    stage?: string;
    status?: string;
    error?: IResponseError;
    progress?: StageProgressOutput;
    activity?: StageActivityEntry[];
    [key: string]: unknown;
}

/** How many trailing activity lines to keep in the output (bounds the task record's size). */
const ACTIVITY_LIMIT = 60;

type RunParams = TaskDefinition.RunParams<StageTaskInput, StageTaskOutput>;
type RunResult = Promise<TaskDefinition.Result<StageTaskInput, StageTaskOutput>>;

/**
 * The one place a stage's run is orchestrated, shared by all nine stage tasks.
 *
 * It owns the ledger transitions (running -> done/failed), the deterministic artifact keying, progress
 * reporting, and releasing the run's lock when the pipeline completes. The stage-specific work is the
 * `StageHandler`'s; everything else is here so the nine tasks stay thin and identical.
 */
export interface IStageTaskRunner {
    execute(stage: Stage, params: RunParams): RunResult;
}

export const StageTaskRunner = createAbstraction<IStageTaskRunner>(
    "ComponentExtraction/StageTaskRunner"
);
export namespace StageTaskRunner {
    export type Interface = IStageTaskRunner;
}

class StageTaskRunnerImpl implements IStageTaskRunner {
    constructor(
        private runRepository: RunRepository.Interface,
        private jobRepository: JobRepository.Interface,
        private runLock: RunLock.Interface,
        private artifactStore: StageArtifactStore.Interface,
        private blobStore: BlobStore.Interface,
        private handlers: StageHandler.Interface[],
        private identityContext: IdentityContext.Interface,
        private sendToIdentity: WebsocketsSendToIdentityUseCase.Interface
    ) {}

    async execute(stage: Stage, { input, controller }: RunParams): RunResult {
        const now = () => new Date().toISOString();
        const log = controller.logger;

        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const runResult = await this.runRepository.get(input.runId);
        if (runResult.isFail()) {
            return controller.response.error(runResult.error.message);
        }
        const run = runResult.value;

        const jobResult = await this.jobRepository.get(run.jobId);
        if (jobResult.isFail()) {
            return controller.response.error(jobResult.error.message);
        }
        const job = jobResult.value;

        // Append one line to the task-output activity trail (the admin reads this back), refresh the
        // latest-progress snapshot, and push it live over the websocket. Best-effort — it reads the
        // current output and writes the full bounded array, so the trail accumulates across items and
        // across continuation iterations (same task) without the log's replace-on-write loss.
        const appendActivity = async (
            message: string,
            opts: { current?: number; total?: number } = {}
        ): Promise<void> => {
            try {
                const existingActivity =
                    (controller.state.getOutput()?.activity as StageActivityEntry[] | undefined) ??
                    [];
                const activity = [
                    ...existingActivity,
                    { message, current: opts.current, total: opts.total, at: now() }
                ].slice(-ACTIVITY_LIMIT);
                await controller.state.updateOutput({
                    activity,
                    progress: {
                        stage,
                        current: opts.current ?? 0,
                        total: opts.total ?? 0,
                        message
                    }
                });
            } catch (error) {
                console.log(
                    `[component-extraction] Could not persist activity: ${
                        error instanceof Error ? error.message : String(error)
                    }`
                );
            }
            await this.report(STAGE_PROGRESS_ACTION, {
                runId: run.id,
                jobId: job.id,
                stage,
                status: "running",
                message,
                current: opts.current,
                total: opts.total
            });
        };

        // A stage already "running" means this invocation is a continuation of it (a `response.continue`
        // re-invoke), not a fresh start — so the start bookkeeping runs only on the first invocation.
        const existing = stageEntry(run.stages, stage);
        const resuming = existing?.status === "running";

        // The version this run of the stage is producing — one past whatever it currently has. Stable
        // across continuations: the entry's `stageVersion` only bumps at `markStageDone`, so re-deriving
        // it every iteration yields the same value, and artifact keys stay consistent while resuming.
        const targetVersion = (existing?.stageVersion ?? 0) + 1;

        let ledger = run.stages;
        if (!resuming) {
            // First invocation: mark running, stamp the task id (for log deep-linking), announce the start.
            const taskId = controller.state.getTask().id;
            ledger = withStageTaskId(markStageRunning(run.stages, stage, now()), stage, taskId);
            const persistedRunning = await this.runRepository.update(run.id, {
                stages: ledger,
                status: "running"
            });
            if (persistedRunning.isFail()) {
                return controller.response.error(persistedRunning.error.message);
            }
            await this.report(STAGE_PROGRESS_ACTION, {
                runId: run.id,
                jobId: job.id,
                stage,
                status: "running"
            });
            await appendActivity(`Stage "${stage}" started.`);
        } else {
            await appendActivity(`Stage "${stage}" resuming.`);
        }

        const handler = this.handlers.find(candidate => candidate.stage === stage);
        if (!handler) {
            // Expected in W3 (no handlers yet); W4 registers the nine. Fail the stage cleanly rather
            // than leave it stuck "running".
            return this.fail(
                controller,
                run.id,
                job.id,
                stage,
                ledger,
                `Stage "${stage}" has no handler registered.`,
                now
            );
        }

        const previous = previousStage(stage);
        const upstream = previous ? (stageEntry(ledger, previous)?.artifacts ?? {}) : {};

        // The reporter the handler calls per item — one line on the activity trail + a live websocket.
        const progress = (update: {
            message: string;
            current?: number;
            total?: number;
            data?: Record<string, unknown>;
        }): Promise<void> =>
            appendActivity(update.message, { current: update.current, total: update.total });

        let outcome;
        try {
            outcome = await handler.execute({
                run: { ...run, stages: ledger },
                job,
                upstream,
                artifactKey: name => stageArtifactKey(run.id, stage, targetVersion, name),
                store: this.artifactStore,
                blobs: this.blobStore,
                log,
                progress,
                isCloseToTimeout: (safetyMarginSeconds?: number) =>
                    controller.runtime.isCloseToTimeout(safetyMarginSeconds)
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await log.error({ message: `Stage "${stage}" threw.`, error });
            await appendActivity(`Stage "${stage}" failed: ${message}`);
            return this.fail(controller, run.id, job.id, stage, ledger, message, now);
        }

        if (outcome.isFail()) {
            await appendActivity(`Stage "${stage}" failed: ${outcome.error.message}`);
            return this.fail(controller, run.id, job.id, stage, ledger, outcome.error.message, now);
        }

        // Continuation: the stage checkpointed and has more work. Persist any partial counts so the run
        // reflects progress between iterations, then re-invoke via the task framework. `continue` leaves
        // the task output untouched, so the activity trail carries over to the next iteration.
        if (outcome.value.more) {
            if (outcome.value.counts) {
                await this.runRepository.update(run.id, {
                    counts: { ...run.counts, ...outcome.value.counts }
                });
            }
            await appendActivity(`Stage "${stage}" checkpointed; continuing in a new run…`);
            return controller.response.continue(input, { seconds: 1 });
        }

        const done = markStageDone(ledger, stage, outcome.value.artifacts, now());
        const counts = { ...run.counts, ...outcome.value.counts };
        // The pipeline's terminal stage completing means the run is done; anything earlier leaves it
        // running (the gate awaits the next `runStage`).
        const runStatus = stage === "promote" ? "done" : "running";
        const persistedDone = await this.runRepository.update(run.id, {
            stages: done,
            counts,
            status: runStatus
        });
        if (persistedDone.isFail()) {
            return controller.response.error(persistedDone.error.message);
        }

        if (stage === "promote") {
            // The run is complete — free the job's one-in-flight-run slot.
            await this.runLock.release(job.id, run.id);
        }

        await appendActivity(`Stage "${stage}" done.`);
        await this.report(STAGE_DONE_ACTION, {
            runId: run.id,
            jobId: job.id,
            stage,
            status: "done",
            degraded: outcome.value.degraded
        });
        // Hand the accumulated output (with the activity trail) to `done` so the framework's completion
        // write re-persists it rather than blanking the output.
        return controller.response.done(controller.state.getOutput());
    }

    private async fail(
        controller: RunParams["controller"],
        runId: string,
        jobId: string,
        stage: Stage,
        ledger: ReturnType<typeof markStageRunning>,
        message: string,
        now: () => string
    ): RunResult {
        const failed = markStageFailed(ledger, stage, message, now());
        await this.runRepository.update(runId, { stages: failed, status: "failed" });
        await this.report(STAGE_FAILED_ACTION, { runId, jobId, stage, status: "failed", message });
        return controller.response.error(message);
    }

    /** Progress is a courtesy — a dropped websocket must never fail a stage that otherwise succeeded. */
    private async report(action: string, data: StageProgressPayload): Promise<void> {
        try {
            const identity = this.identityContext.getIdentity();
            await this.sendToIdentity.execute({ id: identity.id }, { action, data });
        } catch (error) {
            console.log(
                `[component-extraction] Could not report progress: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }
}

export const StageTaskRunnerService = createImplementation({
    abstraction: StageTaskRunner,
    implementation: StageTaskRunnerImpl,
    dependencies: [
        RunRepository,
        JobRepository,
        RunLock,
        StageArtifactStore,
        BlobStore,
        [StageHandler, { multiple: true }],
        IdentityContext,
        WebsocketsSendToIdentityUseCase
    ]
});
