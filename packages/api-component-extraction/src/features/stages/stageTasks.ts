import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { STAGES, stageTaskId, type Stage } from "~/constants.js";
import { StageTaskRunner, type StageTaskInput, type StageTaskOutput } from "./StageTaskRunner.js";

/**
 * One `TaskDefinition` per stage — nine tasks, each triggered independently by `runStage`. They are
 * deliberately thin: every task delegates to the shared `StageTaskRunner`, bound to its own stage.
 * `databaseLogs = true` so the trail shows in the Admin Background Tasks viewer, and not private so a
 * failed stage persists for inspection.
 *
 * `maxIterations` is generous because a long stage (Capture over many pages, the model-backed stages)
 * checkpoints near the 900s Lambda timeout and continues in a fresh iteration via the runner — each
 * iteration is one invocation, so the cap bounds how many continuations a single stage may take. Fast
 * stages finish in their first iteration regardless.
 */
// Per-stage iteration caps. A stage's iteration count is one per continuation (`response.continue`).
// Generate is a *polling coordinator* — it continues every few seconds to check its per-component child
// tasks — so it needs a far larger budget than a stage that only continues near the 900s Lambda timeout.
// (At Generate's ~10s poll interval, 720 covers ~2 hours; a real run finishes in a fraction of that.)
const STAGE_MAX_ITERATIONS: Partial<Record<Stage, number>> = {
    generate: 720
};
const DEFAULT_MAX_ITERATIONS = 30;

const createStageTask = (stage: Stage) => {
    class StageTaskImpl implements TaskDefinition.Interface<StageTaskInput, StageTaskOutput> {
        readonly id = stageTaskId(stage);
        readonly title = `Component extraction — ${stage}`;
        readonly description = `Runs the "${stage}" stage of a component-extraction run.`;
        readonly maxIterations = STAGE_MAX_ITERATIONS[stage] ?? DEFAULT_MAX_ITERATIONS;
        readonly isPrivate = false;
        readonly databaseLogs = true;

        // Public (not `private`) because the class is produced by a factory and its inferred type is
        // exported via STAGE_TASKS — a private member would trip TS4094 on the exported anonymous type.
        constructor(readonly runner: StageTaskRunner.Interface) {}

        run(params: TaskDefinition.RunParams<StageTaskInput, StageTaskOutput>) {
            return this.runner.execute(stage, params);
        }

        // If a stage ever exhausts its iterations, mark it failed so the ledger never stays stuck
        // "running" behind a dead task — the operator can then re-run it to resume from the checkpoint.
        async onMaxIterations({
            task
        }: TaskDefinition.LifecycleHookParams<StageTaskInput, StageTaskOutput>) {
            await this.runner.markStalled(stage, task.input.runId);
        }
    }

    return TaskDefinition.createImplementation({
        implementation: StageTaskImpl,
        dependencies: [StageTaskRunner]
    });
};

/** The nine stage-task registrations, in pipeline order. Registered in `feature.ts`. */
export const STAGE_TASKS = STAGES.map(stage => createStageTask(stage));
