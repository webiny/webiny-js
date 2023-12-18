import { ITaskData, ITaskDataValues } from "~/types";

export type ITaskManagerStoreUpdateTaskValues<T extends ITaskDataValues = ITaskDataValues> = T;

export interface ITaskManagerStoreUpdateTaskValuesCb<T extends ITaskDataValues = ITaskDataValues> {
    (values: T): Partial<T>;
}

export type ITaskManagerStoreUpdateTaskParam<T extends ITaskDataValues = ITaskDataValues> =
    | ITaskManagerStoreUpdateTaskValuesCb<T>
    | Partial<ITaskManagerStoreUpdateTaskValues<T>>;

export interface ITaskManagerStore<T extends ITaskDataValues = ITaskDataValues> {
    getTask: () => ITaskData<T>;
    /**
     * Update task values, which are used to store custom user data.
     * You can send partial values, and they will be merged with the existing values.
     *
     * @throws {Error} If task not found or something goes wrong during the database update.
     */
    updateValues: (param: ITaskManagerStoreUpdateTaskParam<T>) => Promise<void>;

    getValues: () => T;
}
