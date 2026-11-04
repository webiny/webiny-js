import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { STEP_RUN_MAX_ITERATIONS, STEP_RUN_TASK_DEFINITION_ID } from "../constants.js";
import { WorkflowStepRunTaskHandler } from "./WorkflowStepRunTaskHandler.js";

/**
 * The one private task that runs a workflow step (R142). Private, so the task list never shows
 * it and the GraphQL `triggerTask` refuses it as unknown; only the engine
 * triggers it, through `TaskService.trigger` in the step run reach. The ceiling is high on
 * purpose: the handler enforces the automation definition's own `maxIterations` (R145).
 *
 * The task is kept (R256). Every outcome is already on the step: success through the runner,
 * failure and abort through the fixed-text `onError` / `onAbort` hooks (raw errors live only in
 * the logs). No self cleanup is set, so the task stays after the step ends: workflows reads it
 * for the details drawer (`GetReviewStepRunUseCase`), and `DeleteTargetReviewsUseCase` cleans up
 * the task of every attempt when its review is deleted. The definition sets no `databaseLogs`
 * (an abort still writes one log row, which that cleanup deletes with the task). A step whose
 * task is gone is handled by `StuckStepService` (grace from the step start).
 */
class WorkflowStepRunTaskDefinitionImpl implements TaskDefinition.Interface {
    public readonly id = STEP_RUN_TASK_DEFINITION_ID;
    public readonly title = "Workflow step run";
    public readonly description = "Runs a step of a workflow review.";
    public readonly isPrivate = true;
    public readonly maxIterations = STEP_RUN_MAX_ITERATIONS;

    public readonly handler: TaskDefinition.Interface["handler"] = WorkflowStepRunTaskHandler;
}

export const WorkflowStepRunTaskDefinition = TaskDefinition.createImplementation({
    implementation: WorkflowStepRunTaskDefinitionImpl,
    dependencies: []
});
