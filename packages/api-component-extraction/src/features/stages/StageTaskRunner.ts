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
import { markStageDone, markStageFailed, markStageRunning, stageEntry } from "~/domain/ledger.js";
import { previousStage, stageArtifactKey, type Stage } from "~/constants.js";

export interface StageTaskInput {
    runId: string;
    [key: string]: string | undefined;
}

export interface StageTaskOutput {
    stage?: string;
    status?: string;
    error?: IResponseError;
    [key: string]: string | string[] | IResponseError | undefined;
}

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

        // The version this run of the stage is producing — one past whatever it currently has. Used to
        // key artifacts, and the value `markStageDone` bumps to.
        const targetVersion = (stageEntry(run.stages, stage)?.stageVersion ?? 0) + 1;

        const running = markStageRunning(run.stages, stage, now());
        const persistedRunning = await this.runRepository.update(run.id, {
            stages: running,
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
        await log.info({ message: `Stage "${stage}" started.`, data: { runId: run.id, stage } });

        const handler = this.handlers.find(candidate => candidate.stage === stage);
        if (!handler) {
            // Expected in W3 (no handlers yet); W4 registers the nine. Fail the stage cleanly rather
            // than leave it stuck "running".
            return this.fail(
                controller,
                run.id,
                job.id,
                stage,
                running,
                `Stage "${stage}" has no handler registered.`,
                now
            );
        }

        const previous = previousStage(stage);
        const upstream = previous ? (stageEntry(running, previous)?.artifacts ?? {}) : {};

        let outcome;
        try {
            outcome = await handler.execute({
                run: { ...run, stages: running },
                job,
                upstream,
                artifactKey: name => stageArtifactKey(run.id, stage, targetVersion, name),
                store: this.artifactStore,
                blobs: this.blobStore,
                log
            });
        } catch (error) {
            await log.error({ message: `Stage "${stage}" threw.`, error });
            return this.fail(
                controller,
                run.id,
                job.id,
                stage,
                running,
                error instanceof Error ? error.message : String(error),
                now
            );
        }

        if (outcome.isFail()) {
            return this.fail(
                controller,
                run.id,
                job.id,
                stage,
                running,
                outcome.error.message,
                now
            );
        }

        const done = markStageDone(running, stage, outcome.value.artifacts, now());
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

        await this.report(STAGE_DONE_ACTION, {
            runId: run.id,
            jobId: job.id,
            stage,
            status: "done",
            degraded: outcome.value.degraded
        });
        await log.info({
            message: `Stage "${stage}" done.`,
            data: { runId: run.id, stage, artifacts: Object.keys(outcome.value.artifacts) }
        });
        return controller.response.done();
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
