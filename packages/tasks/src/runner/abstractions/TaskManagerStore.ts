import { ITaskData, ITaskDataLog, ITaskDataValues, ITaskUpdateData, TaskDataStatus } from "~/types";

export type ITaskManagerStoreUpdateTaskValues<T extends ITaskDataValues = ITaskDataValues> = T;

export interface ITaskManagerStoreUpdateTaskValuesCb<T extends ITaskDataValues = ITaskDataValues> {
    (values: T): Partial<T>;
}

export type ITaskManagerStoreUpdateTaskValuesParam<T extends ITaskDataValues = ITaskDataValues> =
    | ITaskManagerStoreUpdateTaskValuesCb<T>
    | Partial<ITaskManagerStoreUpdateTaskValues<T>>;

export interface ITaskManagerStoreUpdateTaskParamCb<T extends ITaskDataValues = ITaskDataValues> {
    (task: ITaskData<T>): ITaskUpdateData<T>;
}

export type ITaskManagerStoreUpdateTask<T extends ITaskDataValues = ITaskDataValues> =
    ITaskUpdateData<T>;

export type ITaskManagerStoreUpdateTaskParam<T extends ITaskDataValues = ITaskDataValues> =
    | ITaskManagerStoreUpdateTaskParamCb<T>
    | Partial<ITaskManagerStoreUpdateTask<T>>;

export interface ITaskManagerStore<T extends ITaskDataValues = ITaskDataValues> {
    setTask: (task: ITaskData<T>) => void;
    getTask: () => ITaskData<T>;
    getStatus: () => TaskDataStatus;
    /**
     * @throws {Error} If task not found or something goes wrong during the database update.
     */
    updateTask: (values: ITaskManagerStoreUpdateTaskParam) => Promise<void>;
    /**
     * Update task values, which are used to store custom user data.
     * You can send partial values, and they will be merged with the existing values.
     *
     * @throws {Error} If task not found or something goes wrong during the database update.
     */
    updateValues: (param: ITaskManagerStoreUpdateTaskValuesParam<T>) => Promise<void>;
    getValues: () => T;
    addLog: (log: Omit<ITaskDataLog, "createdOn">) => Promise<void>;
}
