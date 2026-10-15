import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { STEP_RUN_MAX_ITERATIONS, STEP_RUN_TASK_DEFINITION_ID } from "../constants.js";
import { WorkflowStepRunTaskHandler } from "./WorkflowStepRunTaskHandler.js";

/**
 * The one private task that runs a workflow step (R142). Private, so the task list never shows
 * it and the GraphQL `triggerTask` refuses it as unknown (SEC-68, Task 7); only the engine
 * triggers it, through `TaskService.trigger` in the step run reach. The ceiling is high on
 * purpose: the handler enforces the automation definition's own `maxIterations` (R145).
 *
 * The task cleans itself up (R179). Every outcome is already on the step: success through the
 * runner, failure and abort through the fixed-text `onError` / `onAbort` hooks (raw errors live
 * only in the logs). Background tasks run the definition's own hook first and delete the task
 * after it, so the step is written before the task is gone, and turn the task's database logs
 * off (an abort still writes one log row, which the cleanup now deletes). A step whose task is gone is handled by `StuckStepService` (grace from the step start).
 */
class WorkflowStepRunTaskDefinitionImpl implements TaskDefinition.Interface {
    public readonly id = STEP_RUN_TASK_DEFINITION_ID;
    public readonly title = "Workflow step run";
    public readonly description = "Runs an automation step of a workflow review.";
    public readonly isPrivate = true;
    public readonly maxIterations = STEP_RUN_MAX_ITERATIONS;
    public readonly selfCleanup = "always" as const;

    public readonly handler: TaskDefinition.Interface["handler"] = WorkflowStepRunTaskHandler;
}

export const WorkflowStepRunTaskDefinition = TaskDefinition.createImplementation({
    implementation: WorkflowStepRunTaskDefinitionImpl,
    dependencies: []
});
