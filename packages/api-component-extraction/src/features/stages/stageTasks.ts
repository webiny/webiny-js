import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { STAGES, stageTaskId, type Stage } from "~/constants.js";
import { StageTaskRunner, type StageTaskInput, type StageTaskOutput } from "./StageTaskRunner.js";

/**
 * One `TaskDefinition` per stage — nine tasks, each triggered independently by `runStage`. They are
 * deliberately thin: every task delegates to the shared `StageTaskRunner`, bound to its own stage. Phase
 * 1 sets `maxIterations = 1` (nothing fans out yet) and `databaseLogs = true` so the trail shows in the
 * Admin Background Tasks viewer. Not private, so a failed stage persists for inspection.
 */
const createStageTask = (stage: Stage) => {
    class StageTaskImpl implements TaskDefinition.Interface<StageTaskInput, StageTaskOutput> {
        readonly id = stageTaskId(stage);
        readonly title = `Component extraction — ${stage}`;
        readonly description = `Runs the "${stage}" stage of a component-extraction run.`;
        readonly maxIterations = 1;
        readonly isPrivate = false;
        readonly databaseLogs = true;

        // Public (not `private`) because the class is produced by a factory and its inferred type is
        // exported via STAGE_TASKS — a private member would trip TS4094 on the exported anonymous type.
        constructor(readonly runner: StageTaskRunner.Interface) {}

        run(params: TaskDefinition.RunParams<StageTaskInput, StageTaskOutput>) {
            return this.runner.execute(stage, params);
        }
    }

    return TaskDefinition.createImplementation({
        implementation: StageTaskImpl,
        dependencies: [StageTaskRunner]
    });
};

/** The nine stage-task registrations, in pipeline order. Registered in `feature.ts`. */
export const STAGE_TASKS = STAGES.map(stage => createStageTask(stage));
