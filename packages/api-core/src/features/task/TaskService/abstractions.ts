import { BaseError, createAbstraction, Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import { type ITaskOutput, TaskDefinition } from "~/features/task/TaskDefinition/index.js";

/** Trigger and manage long-running background tasks. */
export const TaskService = createAbstraction<ITaskService>("TaskService");

export namespace TaskService {
    export type Interface = ITaskService;
    /**
     * This is the output of `trigger` and `abort` actions.
     */
    export type GenericOutput = IGenericOutput;

    export type TaskInput = TaskDefinition.TaskInput;

    export type Task<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends ITaskOutput = ITaskOutput
    > = ITask<I, O>;
}

// The service info depends on the implementation.
// We cannot have a more precise type here, since implementation can be anything (AWS, Azure, etc.).
export type IServiceInfo = GenericRecord;

export interface IResponseError {
    message: string;
    code?: string | null;
    data?: GenericRecord | null;
    stack?: string;
}

export interface ITaskAbortParams {
    id: string;
    message?: string;
}

export interface ITaskService {
    trigger: <
        T extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends IGenericOutput = IGenericOutput
    >(
        params: ITaskTriggerParams<T>
    ) => Promise<Result<ITask<T, O>, BaseError>>;
    abort: <
        T extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends IGenericOutput = IGenericOutput
    >(
        params: ITaskAbortParams
    ) => Promise<Result<ITask<T, O>, BaseError>>;
    fetchServiceInfo: (input: ITask<any, any> | string) => Promise<Result<IServiceInfo, BaseError>>;
}

export interface IGenericOutput {
    error?: IResponseError;
    [key: string]:
        | string
        | string[]
        | number
        | boolean
        | undefined
        | Record<string, any>
        | IResponseError;
}

export interface ITaskTriggerParams<I = TaskDefinition.TaskInput> {
    parent?: Pick<ITask, "id">;
    definition: string;
    name?: string;
    input?: I;
    delay?: number;
}

export interface ITaskValues<T = GenericRecord, O extends ITaskOutput = ITaskOutput> {
    startedOn?: string;
    finishedOn?: string;
    eventResponse: GenericRecord | undefined;
    iterations: number;
    parentId?: string;
    name: string;
    taskStatus: TaskDataStatus;
    definitionId: string;
    executionName: string;
    input: T;
    output?: O;
}

export interface ITask<T = GenericRecord, O extends ITaskOutput = ITaskOutput> extends ITaskValues<
    T,
    O
> {
    /**
     * ID without the revision number (for example: #0001).
     */
    id: string;
    createdOn: string;
    savedOn: string;
    createdBy: ITaskIdentity;
}

export enum TaskDataStatus {
    PENDING = "pending",
    RUNNING = "running",
    FAILED = "failed",
    SUCCESS = "success",
    ABORTED = "aborted"
}

export interface ITaskIdentity {
    id: string;
    displayName: string;
    type: string;
}
