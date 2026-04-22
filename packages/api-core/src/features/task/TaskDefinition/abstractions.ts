import zod from "zod";
import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types";
import type { ITask } from "~/features/task/TaskService/index.js";
import { TaskController } from "~/features/task/TaskController/index.js";

export type ITaskInput = GenericRecord;

export interface IResponseError {
    message: string;
    code?: string | null;
    data?: GenericRecord | null;
    stack?: string;
}

export interface ITaskOutput {
    error?: IResponseError;
    [key: string]: any;
}

/**
 * Task run params - ONLY the input data
 * All runtime dependencies come from TaskController (injected separately)
 */
export interface ITaskRunParams<
    I extends ITaskInput = ITaskInput,
    O extends ITaskOutput = ITaskOutput
> {
    input: I;
    controller: TaskController.Interface<I, O>;
}

/**
 * Data for creating a new task
 */
export interface ITaskCreateData<I = ITaskInput> {
    definitionId: string;
    name: string;
    input: I;
    parentId?: string;
}

/**
 * Parameters for onBeforeTrigger lifecycle hook
 */
export interface ITaskBeforeTriggerParams<I = ITaskInput> {
    data: ITaskCreateData<I>;
}

/**
 * Task result status enum
 */
export enum TaskResultStatus {
    DONE = "done",
    CONTINUE = "continue",
    ERROR = "error",
    ABORTED = "aborted"
}

/**
 * Specific result types
 */
export interface ITaskResultDone<O extends ITaskOutput = ITaskOutput> {
    status: TaskResultStatus.DONE;
    message?: string;
    output?: O;
}

export interface ITaskResultContinue<I = ITaskInput> {
    status: TaskResultStatus.CONTINUE;
    input: I;
    wait?: number; // seconds to wait before next iteration
}

export interface ITaskResultError {
    status: TaskResultStatus.ERROR;
    error: IResponseError;
}

export interface ITaskResultAborted {
    status: TaskResultStatus.ABORTED;
}

export type ITaskResult<I = ITaskInput, O extends ITaskOutput = ITaskOutput> =
    | ITaskResultDone<O>
    | ITaskResultContinue<I>
    | ITaskResultError
    | ITaskResultAborted;

export type SelfCleanupEvent = "onSuccess" | "onError" | "onAbort";

export type SelfCleanup = "always" | "never" | SelfCleanupEvent | SelfCleanupEvent[];

export type ITaskLifecycleHook<
    I extends ITaskInput = ITaskInput,
    O extends ITaskOutput = ITaskOutput
> = {
    task: ITask<I, O>;
};

/**
 * Core TaskDefinition - minimal interface
 */
export interface ITaskDefinition<
    I extends ITaskInput = ITaskInput,
    O extends ITaskOutput = ITaskOutput
> {
    id: string;
    title: string;
    description?: string;
    maxIterations?: number;
    databaseLogs?: boolean;
    isPrivate?: boolean;
    selfCleanup?: SelfCleanup;

    /**
     * Core run method - receives ONLY input params
     * All runtime dependencies (logging, state management, etc.) come from TaskController
     */
    run(params: ITaskRunParams<I, O>): Promise<ITaskResult<I, O>>;

    /**
     * Optional lifecycle hooks - receive task data and the tenant context.
     */
    onBeforeTrigger?(params: ITaskBeforeTriggerParams<I>): Promise<void>;
    onDone?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    onError?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    onAbort?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    onMaxIterations?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    /**
     * Create a validation schema for the task input.
     * This will be used to validate the input before the task is triggered.
     */
    createInputValidation?(
        params: ITaskCreateInputValidationParams
    ): GenericRecord<keyof I, zod.Schema> | zod.Schema;
}

export interface ITaskCreateInputValidationParams {
    validator: typeof zod;
}

/** Define a long-running background task with lifecycle hooks. */
export const TaskDefinition = createAbstraction<ITaskDefinition>("TaskDefinition");

/**
 * IRunnableTaskDefinition represents a TaskDefinition after decoration/processing.
 * All optional runtime properties are guaranteed to have values (with defaults applied).
 * Used internally by the task runner to ensure consistent behavior.
 */
export interface IRunnableTaskDefinition<
    I extends ITaskInput = ITaskInput,
    O extends ITaskOutput = ITaskOutput
> extends ITaskDefinition<I, O> {
    // Override optional properties to be required with guaranteed values
    isPrivate: boolean;
    databaseLogs: boolean;
    maxIterations: number;
}

export namespace TaskDefinition {
    export type Interface<
        I extends ITaskInput = ITaskInput,
        O extends ITaskOutput = ITaskOutput
    > = ITaskDefinition<I, O>;

    export type TaskInput = ITaskInput;

    export type TaskOutput = ITaskOutput;

    export type Runnable<
        I extends ITaskInput = ITaskInput,
        O extends ITaskOutput = ITaskOutput
    > = IRunnableTaskDefinition<I, O>;

    export type RunParams<
        I extends ITaskInput = ITaskInput,
        O extends ITaskOutput = ITaskOutput
    > = ITaskRunParams<I, O>;

    export type Result<
        I extends ITaskInput = ITaskInput,
        O extends ITaskOutput = ITaskOutput
    > = ITaskResult<I, O>;

    export type Task<
        I extends ITaskInput = ITaskInput,
        O extends ITaskOutput = ITaskOutput
    > = ITask<I, O>;

    export type ResultDone<O extends ITaskOutput = ITaskOutput> = ITaskResultDone<O>;
    export type ResultContinue<I = ITaskInput> = ITaskResultContinue<I>;
    export type ResultError = ITaskResultError;
    export type ResultAborted = ITaskResultAborted;
    export type CreateInputValidationParams = ITaskCreateInputValidationParams;
    export type TaskCreateData<I = ITaskInput> = ITaskCreateData<I>;
    export type BeforeTriggerParams<I = ITaskInput> = ITaskBeforeTriggerParams<I>;
    export type LifecycleHookParams<
        I extends ITaskInput = ITaskInput,
        O extends ITaskOutput = ITaskOutput
    > = ITaskLifecycleHook<I, O>;

    export type SelfCleanupEvent = import("./abstractions.js").SelfCleanupEvent;
    export type SelfCleanup = import("./abstractions.js").SelfCleanup;
}
