import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
import {
    type ITaskOutput,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import type { StepRunTaskInput } from "@webiny/api-workflows/features/stepRun/types.js";

const NOW = "2026-10-14T10:00:00.000Z";

export interface FakeTaskControllerParams {
    taskId: string;
    /** The id of the identity that created the task: the requester (R149). */
    createdById: string;
    input: StepRunTaskInput;
    /** `iterations` of the task; 1 on the first run. */
    iterations?: number;
    /** What a previous iteration wrote with `updateOutput`. */
    output?: ITaskOutput;
    /** The task's remaining runtime; 900000 by default. */
    remainingMilliseconds?: number;
}

/**
 * A `TaskController` for driving a task handler directly: `response` builds the same result
 * objects as the runner's, `state` is backed by plain variables and `outputUpdates` records every
 * `updateOutput` call.
 */
export const createFakeTaskController = (params: FakeTaskControllerParams) => {
    const task: TaskService.Task<StepRunTaskInput> = {
        id: params.taskId,
        name: "Workflow step: AI review",
        definitionId: "workflowsStepRun",
        executionName: "",
        input: params.input,
        iterations: params.iterations ?? 1,
        taskStatus: TaskDataStatus.RUNNING,
        eventResponse: undefined,
        createdOn: NOW,
        savedOn: NOW,
        createdBy: { id: params.createdById, displayName: "John Doe", type: "admin" }
    };
    let output: ITaskOutput | undefined = params.output;
    const outputUpdates: ITaskOutput[] = [];
    const remaining = params.remainingMilliseconds ?? 900000;

    const controller = {
        response: {
            done: (message?: string, doneOutput?: ITaskOutput) => ({
                status: TaskResultStatus.DONE,
                message,
                output: doneOutput
            }),
            continue: (input: StepRunTaskInput, options?: { seconds: number }) => ({
                status: TaskResultStatus.CONTINUE,
                input,
                wait: options && options.seconds >= 1 ? options.seconds : undefined
            }),
            error: (error: Error | string) => ({
                status: TaskResultStatus.ERROR,
                error: { message: typeof error === "string" ? error : error.message }
            }),
            aborted: () => ({ status: TaskResultStatus.ABORTED })
        },
        state: {
            getTask: () => task,
            getStatus: () => task.taskStatus,
            getInput: () => task.input,
            getOutput: () => output,
            updateInput: async () => undefined,
            updateOutput: async (values: ITaskOutput) => {
                outputUpdates.push(structuredClone(values));
                output = { ...output, ...values };
            }
        },
        logger: {
            info: async () => undefined,
            error: async () => undefined
        },
        task: {
            trigger: async () => {
                throw new Error("The step run handler never triggers child tasks.");
            },
            listChildren: async () => []
        },
        runtime: {
            isCloseToTimeout: () => false,
            isAborted: () => false,
            getRemainingSeconds: () => Math.floor(remaining / 1000),
            getRemainingMilliseconds: () => remaining
        }
    };

    return {
        controller: controller as unknown as TaskController.Interface<StepRunTaskInput>,
        task,
        outputUpdates
    };
};
