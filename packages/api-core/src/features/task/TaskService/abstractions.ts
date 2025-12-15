import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { ITaskOutput } from "~/features/task/TaskDefinition/index.js";

export const TaskService = createAbstraction<ITaskService>("TaskService");

export namespace TaskService {
    export type Interface = ITaskService;
    /**
     * This is the output of `trigger` and `abort` actions.
     */
    export type GenericOutput = IGenericOutput;

    export type TaskDataInput = ITaskDataInput;

    export type Task<
        I extends ITaskDataInput = ITaskDataInput,
        O extends ITaskOutput = ITaskOutput
    > = ITask<I, O>;
}

export type ITaskDataInput = GenericRecord;

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
    trigger: <T extends ITaskDataInput = ITaskDataInput, O extends IGenericOutput = IGenericOutput>(
        params: ITaskTriggerParams<T>
    ) => Promise<ITask<T, O>>;
    abort: <T extends ITaskDataInput = ITaskDataInput, O extends IGenericOutput = IGenericOutput>(
        params: ITaskAbortParams
    ) => Promise<ITask<T, O>>;
    fetchServiceInfo: (input: ITask<any, any> | string) => Promise<IServiceInfo | null>;
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

export interface ITaskTriggerParams<I = ITaskDataInput> {
    parent?: Pick<ITask, "id">;
    definition: string;
    name?: string;
    input?: I;
    delay?: number;
}

export interface ITask<T = GenericRecord, O extends ITaskOutput = ITaskOutput> {
    /**
     * ID without the revision number (for example: #0001).
     */
    id: string;
    name: string;
    taskStatus: TaskDataStatus;
    definitionId: string;
    executionName: string;
    input: T;
    output?: O;
    createdOn: string;
    savedOn: string;
    createdBy: ITaskIdentity;
    startedOn?: string;
    finishedOn?: string;
    eventResponse: GenericRecord | undefined;
    iterations: number;
    parentId?: string;
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
