import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { STEP_RUN_MAX_ITERATIONS, STEP_RUN_TASK_DEFINITION_ID } from "../constants.js";
import { WorkflowStepRunTaskHandler } from "./WorkflowStepRunTaskHandler.js";

/**
 * The one private task that runs an automation step (R142). Private, so the task list never shows
 * it and the GraphQL `triggerTask` refuses it as unknown (SEC-68, Task 7); only the engine
 * triggers it, through `TaskService.trigger` in the automation reach. The ceiling is high on
 * purpose: the handler enforces the automation definition's own `maxIterations` (R145).
 */
class WorkflowStepRunTaskDefinitionImpl implements TaskDefinition.Interface {
    public readonly id = STEP_RUN_TASK_DEFINITION_ID;
    public readonly title = "Workflow step run";
    public readonly description = "Runs an automation step of a workflow review.";
    public readonly isPrivate = true;
    public readonly maxIterations = STEP_RUN_MAX_ITERATIONS;
    public readonly selfCleanup = "never" as const;

    public readonly handler: TaskDefinition.Interface["handler"] = WorkflowStepRunTaskHandler;
}

export const WorkflowStepRunTaskDefinition = TaskDefinition.createImplementation({
    implementation: WorkflowStepRunTaskDefinitionImpl,
    dependencies: []
});
