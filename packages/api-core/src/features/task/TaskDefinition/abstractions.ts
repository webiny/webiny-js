import zod from "zod";
import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types";
import type { ITask } from "~/features/task/TaskService/index.js";
import { TaskController } from "~/features/task/TaskController/index.js";

export type ITaskDataInput = GenericRecord;

export interface IResponseError {
    message: string;
    code?: string | null;
    data?: GenericRecord | null;
    stack?: string;
}

export interface ITaskDoneOutput {
    error?: IResponseError;
    [key: string]: any;
}

/**
 * Task run params - ONLY the input data
 * All runtime dependencies come from TaskController (injected separately)
 */
export interface ITaskRunParams<
    I extends ITaskDataInput = ITaskDataInput,
    O extends ITaskDoneOutput = ITaskDoneOutput
> {
    input: I;
    controller: TaskController.Interface<I, O>;
}

/**
 * Data for creating a new task
 */
export interface ITaskCreateData<I = ITaskDataInput> {
    definitionId: string;
    name: string;
    input: I;
    parentId?: string;
}

/**
 * Parameters for onBeforeTrigger lifecycle hook
 */
export interface ITaskBeforeTriggerParams<I = ITaskDataInput> {
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
export interface ITaskResultDone<O extends ITaskDoneOutput = ITaskDoneOutput> {
    status: TaskResultStatus.DONE;
    message?: string;
    output?: O;
}

export interface ITaskResultContinue<I = ITaskDataInput> {
    status: TaskResultStatus.CONTINUE;
    message?: string;
    input: I;
    wait?: number; // seconds to wait before next iteration
}

export interface ITaskResultError {
    status: TaskResultStatus.ERROR;
    message: string;
    error?: IResponseError;
}

export interface ITaskResultAborted {
    status: TaskResultStatus.ABORTED;
    message?: string;
}

export type ITaskResult<I = ITaskDataInput, O extends ITaskDoneOutput = ITaskDoneOutput> =
    | ITaskResultDone<O>
    | ITaskResultContinue<I>
    | ITaskResultError
    | ITaskResultAborted;

export type ITaskLifecycleHook<
    I extends ITaskDataInput = ITaskDataInput,
    O extends ITaskDoneOutput = ITaskDoneOutput
> = { task: ITask<I, O> };

/**
 * Core TaskDefinition - minimal interface
 */
export interface ITaskDefinition<
    I extends ITaskDataInput = ITaskDataInput,
    O extends ITaskDoneOutput = ITaskDoneOutput
> {
    id: string;
    title: string;
    description?: string;
    maxIterations?: number;
    disableDatabaseLogs?: boolean;
    isPrivate?: boolean;

    /**
     * Core run method - receives ONLY input params
     * All runtime dependencies (logging, state management, etc.) come from TaskController
     */
    run(params: ITaskRunParams<I, O>): Promise<ITaskResult<I, O>>;

    /**
     * Optional lifecycle hooks - receive task data, no context
     */
    onBeforeTrigger?(params: ITaskBeforeTriggerParams<I>): Promise<void>;
    onDone?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    onError?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    onAbort?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    onMaxIterations?(params: ITaskLifecycleHook<I, O>): Promise<void>;
    /**
     * Create a validation schema for the task input.
     * This will be used to validate the input before the task is triggered.
     *
     * By default, the input validation validates the input against the fields defined in the task definition.
     * But it also passes through any fields which might not be defined in the task validation.
     */
    createInputValidation?: (
        params: ITaskCreateInputValidationParams
    ) => GenericRecord<keyof I, zod.Schema> | zod.Schema;
}

export interface ITaskCreateInputValidationParams {
    validator: typeof zod;
}

export const TaskDefinition = createAbstraction<ITaskDefinition>("TaskDefinition");

/**
 * IRunnableTaskDefinition represents a TaskDefinition after decoration/processing.
 * All optional runtime properties are guaranteed to have values (with defaults applied).
 * Used internally by the task runner to ensure consistent behavior.
 */
export interface IRunnableTaskDefinition<
    I extends ITaskDataInput = ITaskDataInput,
    O extends ITaskDoneOutput = ITaskDoneOutput
> extends ITaskDefinition<I, O> {
    // Override optional properties to be required with guaranteed values
    isPrivate: boolean;
    disableDatabaseLogs: boolean;
    maxIterations: number;
}

export namespace TaskDefinition {
    export type Interface<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskDoneOutput = ITaskDoneOutput
    > = ITaskDefinition<I, O>;

    export type Task<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskDoneOutput = ITaskDoneOutput
    > = ITask<I, O>;

    export type TaskDataInput = ITaskDataInput;

    export type TaskDoneOutput = ITaskDoneOutput;

    export type Runnable<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskDoneOutput = ITaskDoneOutput
    > = IRunnableTaskDefinition<I, O>;

    export type RunParams<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskDoneOutput = ITaskDoneOutput
    > = ITaskRunParams<I, O>;

    export type Result<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskDoneOutput = ITaskDoneOutput
    > = ITaskResult<I, O>;

    export type ResultDone<O extends ITaskDoneOutput = ITaskDoneOutput> = ITaskResultDone<O>;
    export type ResultContinue<I = ITaskDataInput> = ITaskResultContinue<I>;
    export type ResultError = ITaskResultError;
    export type ResultAborted = ITaskResultAborted;
    export type CreateInputValidationParams = ITaskCreateInputValidationParams;
    export type TaskCreateData<I = ITaskDataInput> = ITaskCreateData<I>;
    export type LifecycleHookParams<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskDoneOutput = ITaskDoneOutput
    > = ITaskLifecycleHook<I, O>;
}
