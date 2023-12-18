import { Context, ITaskData, ITaskDataValues } from "~/types";
import {
    ITaskManagerStore,
    ITaskManagerStoreUpdateTaskParam
} from "./abstractions/ITaskManagerStore";
/**
 * Package deep-equal does not have types.
 */
// @ts-expect-error
import deepEqual from "deep-equal";

const getValues = <T extends ITaskDataValues = ITaskDataValues>(
    values: T,
    param: ITaskManagerStoreUpdateTaskParam<T>
) => {
    if (typeof param === "function") {
        return param(values);
    }
    return {
        ...values,
        ...param.values
    };
};

export class TaskManagerStore implements ITaskManagerStore {
    private readonly context: Context;
    private task: ITaskData;

    public constructor(context: Context, task: ITaskData) {
        this.context = context;
        this.task = task;
    }

    public getTask<T extends ITaskDataValues = ITaskDataValues>(): ITaskData<T> {
        return this.task as ITaskData<T>;
    }

    public async updateValues<T extends ITaskDataValues = ITaskDataValues>(
        param: ITaskManagerStoreUpdateTaskParam<T>
    ): Promise<void> {
        const values = getValues<T>(this.task.values, param);
        /**
         * No need to update if nothing changed.
         */
        if (deepEqual(values, this.task.values)) {
            return;
        }
        this.task = await this.context.tasks.updateTask(this.task.id, {
            values
        });
    }

    public getValues<T extends ITaskDataValues = ITaskDataValues>(): T {
        return this.task.values as T;
    }
}
