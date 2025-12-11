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

export interface ITaskResponseDoneResultOutput {
    error?: IResponseError;
    [key: string]: any;
}

/**
 * Task run params - ONLY the input data
 * All runtime dependencies come from TaskController (injected separately)
 */
export interface ITaskRunParams<
    I extends ITaskDataInput = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
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
export interface ITaskResultDone<
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
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

export type ITaskResult<
    I = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> = ITaskResultDone<O> | ITaskResultContinue<I> | ITaskResultError | ITaskResultAborted;

/**
 * Core TaskDefinition - minimal interface
 */
export interface ITaskDefinition<
    I extends ITaskDataInput = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
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
    onDone?(params: { task: ITask<I, O> }): Promise<void>;
    onError?(params: { task: ITask<I, O> }): Promise<void>;
    onAbort?(params: { task: ITask<I, O> }): Promise<void>;
    onMaxIterations?(params: { task: ITask<I, O> }): Promise<void>;
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
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> extends ITaskDefinition<I, O> {
    // Override optional properties to be required with guaranteed values
    isPrivate: boolean;
    disableDatabaseLogs: boolean;
    maxIterations: number;
}

export namespace TaskDefinition {
    export type Interface<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    > = ITaskDefinition<I, O>;

    export type Runnable<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    > = IRunnableTaskDefinition<I, O>;

    export type RunParams<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    > = ITaskRunParams<I, O>;

    export type Result<
        I = ITaskDataInput,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    > = ITaskResult<I, O>;

    export type ResultDone<
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    > = ITaskResultDone<O>;
    export type ResultContinue<I = ITaskDataInput> = ITaskResultContinue<I>;
    export type ResultError = ITaskResultError;
    export type ResultAborted = ITaskResultAborted;
    export type CreateInputValidationParams = ITaskCreateInputValidationParams;
    export type TaskCreateData<I = ITaskDataInput> = ITaskCreateData<I>;
}
