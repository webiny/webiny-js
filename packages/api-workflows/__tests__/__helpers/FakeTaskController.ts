import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
import {
    type IResponseError,
    type ITaskOutput,
    TaskResultStatus
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import {
    TaskDataStatus,
    type TaskService
} from "@webiny/api-core/features/task/TaskService/index.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";
import { NOW, requester } from "./fixtures.js";

const toStoredError = (error: IResponseError | Error): IResponseError => {
    const stored: Record<string, unknown> = {};
    for (const key of Object.getOwnPropertyNames(error)) {
        if (key !== "stack") {
            stored[key] = (error as unknown as Record<string, unknown>)[key];
        }
    }
    return stored as unknown as IResponseError;
};

export interface FakeTaskControllerParams {
    taskId?: string;
    /** Defaults to the requester: the trigger runs as the requester (R149). */
    createdById?: string;
    /** `iterations` of the task; 1 on the first run. */
    iterations?: number;
    input?: StepRunTaskInput;
    /** What the previous iteration wrote with `updateOutput`. */
    output?: ITaskOutput;
    /** Makes `updateOutput` throw, as a storage failure would. */
    outputUpdateError?: Error;
    /** What `controller.runtime.getRemainingMilliseconds()` answers; 900000 when omitted (R175). */
    remainingMilliseconds?: number;
}

/**
 * A `TaskController` for driving a task handler directly (R157): `response` builds the same
 * result objects as the runner's (`continue` ignores a wait below one second, like the real one),
 * `state` is backed by plain variables and `outputUpdates` records every `updateOutput` call.
 */
export const createFakeTaskController = (params: FakeTaskControllerParams = {}) => {
    const task: TaskService.Task<StepRunTaskInput> = {
        id: params.taskId ?? "task-1",
        name: "Workflow step: Check links",
        definitionId: "workflowsStepRun",
        executionName: "",
        input: params.input ?? { reviewId: "review-1", stepId: "automation" },
        iterations: params.iterations ?? 1,
        taskStatus: TaskDataStatus.RUNNING,
        eventResponse: undefined,
        createdOn: NOW,
        savedOn: NOW,
        createdBy: {
            id: params.createdById ?? requester.id,
            displayName: requester.displayName,
            type: "admin"
        }
    };
    let output: ITaskOutput | undefined = params.output;
    const outputUpdates: ITaskOutput[] = [];

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
            // Like `DatabaseResponse`, every own property of the error is stored, non-enumerable
            // ones included, so a test sees what would reach the task output.
            error: (error: IResponseError | Error | string) => ({
                status: TaskResultStatus.ERROR,
                error: typeof error === "string" ? { message: error } : toStoredError(error)
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
                if (params.outputUpdateError) {
                    throw params.outputUpdateError;
                }
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
            getRemainingSeconds: () => Math.floor((params.remainingMilliseconds ?? 900000) / 1000),
            getRemainingMilliseconds: () => params.remainingMilliseconds ?? 900000
        }
    };

    return {
        controller: controller as unknown as TaskController.Interface<StepRunTaskInput>,
        task,
        outputUpdates
    };
};
