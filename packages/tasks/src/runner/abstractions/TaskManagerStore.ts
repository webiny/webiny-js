import {
    IResponseError,
    ITask,
    ITaskDataInput,
    ITaskLogItemData,
    ITaskResponseDoneResultOutput,
    ITaskUpdateData,
    TaskDataStatus
} from "~/types";

export type ITaskManagerStoreUpdateTaskValues<T extends ITaskDataInput = ITaskDataInput> = T;

export interface ITaskManagerStoreUpdateTaskValuesCb<T extends ITaskDataInput = ITaskDataInput> {
    (input: T): T;
}

export interface ITaskManagerStoreUpdateTaskInputOptions {
    save: boolean;
}

export type ITaskManagerStoreUpdateTaskInputParam<T extends ITaskDataInput = ITaskDataInput> =
    | ITaskManagerStoreUpdateTaskValuesCb<T>
    | Partial<ITaskManagerStoreUpdateTaskValues<T>>;

export interface ITaskManagerStoreUpdateTaskParamCb<
    T extends ITaskDataInput = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    (task: ITask<T, O>): ITaskUpdateData<T, O>;
}

export type ITaskManagerStoreUpdateTask<
    T extends ITaskDataInput = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> = ITaskUpdateData<T, O>;

export type ITaskManagerStoreUpdateTaskParams<
    T extends ITaskDataInput = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> = ITaskManagerStoreUpdateTaskParamCb<T, O> | Partial<ITaskManagerStoreUpdateTask<T, O>>;

export interface ITaskManagerStoreInfoLog {
    message: string;
    data?: ITaskLogItemData;
}

export interface ITaskManagerStoreErrorLog {
    message: string;
    data?: ITaskLogItemData;
    error: IResponseError | Error;
}

export interface ITaskManagerStoreSetOutputOptions {
    /**
     * Default is true.
     */
    save?: boolean;
}

export interface ITaskManagerStoreUpdateTaskOptions {
    /**
     * Default is true.
     */
    save?: boolean;
}

export interface ITaskManagerStoreAddLogOptions {
    /**
     * Default is true.
     */
    save?: boolean;
}

/**
 * Interface should not be used outside the @webiny/tasks package.
 */
export interface ITaskManagerStorePrivate<
    T extends ITaskDataInput = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    getTask: () => ITask<T, O>;
    getStatus: () => TaskDataStatus;
    /**
     * @throws {Error} If task not found or something goes wrong during the database update.
     */
    updateTask(
        params: ITaskManagerStoreUpdateTaskParams<T, O>,
        options?: ITaskManagerStoreUpdateTaskOptions
    ): Promise<void>;
    /**
     * Update the task input, which are used to store custom user data.
     * You can send partial input, and it will be merged with the existing input.
     *
     * @throws {Error} If task not found or something goes wrong during the database update.
     */
    updateInput: (
        params: ITaskManagerStoreUpdateTaskInputParam<T>,
        options?: ITaskManagerStoreUpdateTaskInputOptions
    ) => Promise<void>;
    getInput: () => T;
    /**
     * Update the task output, which are used to store the output data.
     * You can send partial output, and it will be merged with the existing output.
     *
     * Second parameter is optional options, and it contains a possibility not to store the task immediately.
     *
     * @throws {Error} If task not found or something goes wrong during the database update.
     */
    updateOutput: (
        values: Partial<O>,
        options?: ITaskManagerStoreSetOutputOptions
    ) => Promise<void>;
    getOutput: () => O;
    /**
     * @throws {Error} If task not found or something goes wrong during the database update.
     */
    addInfoLog: (log: ITaskManagerStoreInfoLog) => Promise<void>;
    /**
     * @throws {Error} If task not found or something goes wrong during the database update.
     *
     *
     */
    addErrorLog: (log: ITaskManagerStoreErrorLog) => Promise<void>;
    /**
     * Should store the task and logs into the database, if any.
     * If nothing to update, it should skip calling the internal store methods.
     */
    save(): Promise<void>;
}

export type ITaskManagerStore<
    T extends ITaskDataInput = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> = Omit<ITaskManagerStorePrivate<T, O>, "save">;
