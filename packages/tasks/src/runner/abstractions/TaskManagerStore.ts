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
    (input: T): Partial<T>;
}

export type ITaskManagerStoreUpdateTaskInputParam<T extends ITaskDataInput = ITaskDataInput> =
    | ITaskManagerStoreUpdateTaskValuesCb<T>
    | Partial<ITaskManagerStoreUpdateTaskValues<T>>;

export interface ITaskManagerStoreUpdateTaskParamCb<T extends ITaskDataInput = ITaskDataInput> {
    (task: ITask<T>): ITaskUpdateData<T>;
}

export type ITaskManagerStoreUpdateTask<T extends ITaskDataInput = ITaskDataInput> =
    ITaskUpdateData<T>;

export type ITaskManagerStoreUpdateTaskParam<T extends ITaskDataInput = ITaskDataInput> =
    | ITaskManagerStoreUpdateTaskParamCb<T>
    | Partial<ITaskManagerStoreUpdateTask<T>>;

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

export interface ITaskManagerStore<
    T extends ITaskDataInput = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> {
    setTask: (task: ITask<T, O>) => void;
    getTask: () => ITask<T, O>;
    getStatus: () => TaskDataStatus;
    /**
     * @throws {Error} If task not found or something goes wrong during the database update.
     */
    updateTask: (params: ITaskManagerStoreUpdateTaskParam) => Promise<void>;
    /**
     * Update the task input, which are used to store custom user data.
     * You can send partial input, and it will be merged with the existing input.
     *
     * @throws {Error} If task not found or something goes wrong during the database update.
     */
    updateInput: (params: ITaskManagerStoreUpdateTaskInputParam<T>) => Promise<void>;
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
}
