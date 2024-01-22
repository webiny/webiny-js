import {
    IResponseError,
    ITaskData,
    ITaskDataInput,
    ITaskLogItemData,
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
    (task: ITaskData<T>): ITaskUpdateData<T>;
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
    error: IResponseError;
}

export interface ITaskManagerStore<T extends ITaskDataInput = ITaskDataInput> {
    setTask: (task: ITaskData<T>) => void;
    getTask: () => ITaskData<T>;
    getStatus: () => TaskDataStatus;
    /**
     * @throws {Error} If task not found or something goes wrong during the database update.
     */
    updateTask: (params: ITaskManagerStoreUpdateTaskParam) => Promise<void>;
    /**
     * Update task input, which are used to store custom user data.
     * You can send partial input, and they will be merged with the existing input.
     *
     * @throws {Error} If task not found or something goes wrong during the database update.
     */
    updateInput: (params: ITaskManagerStoreUpdateTaskInputParam<T>) => Promise<void>;
    getInput: () => T;
    addInfoLog: (log: ITaskManagerStoreInfoLog) => Promise<void>;
    addErrorLog: (log: ITaskManagerStoreErrorLog) => Promise<void>;
}
