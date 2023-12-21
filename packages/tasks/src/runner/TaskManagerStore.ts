import {
    ITaskData,
    ITaskDataLog,
    ITaskDataValues,
    ITasksContextObject,
    TaskDataStatus
} from "~/types";
import {
    ITaskManagerStore,
    ITaskManagerStoreUpdateTaskParam,
    ITaskManagerStoreUpdateTaskValuesParam
} from "./abstractions";
/**
 * Package deep-equal does not have types.
 */
// @ts-expect-error
import deepEqual from "deep-equal";

const getValues = <T extends ITaskDataValues = ITaskDataValues>(
    values: T,
    param: ITaskManagerStoreUpdateTaskValuesParam<T>
) => {
    if (typeof param === "function") {
        return param(values);
    }
    return {
        ...values,
        ...param.values
    };
};

export interface TaskManagerStoreContext {
    tasks: Pick<ITasksContextObject, "updateTask">;
}

export class TaskManagerStore implements ITaskManagerStore {
    private readonly context: TaskManagerStoreContext;
    private task: ITaskData;

    public constructor(context: TaskManagerStoreContext, task: ITaskData) {
        this.context = context;
        this.task = task;
    }

    public getStatus(): TaskDataStatus {
        return this.task.status;
    }

    public setTask(task: ITaskData): void {
        this.task = task;
    }

    public getTask<T extends ITaskDataValues = ITaskDataValues>(): ITaskData<T> {
        return this.task as ITaskData<T>;
    }

    public async updateTask(param: ITaskManagerStoreUpdateTaskParam): Promise<void> {
        const values = typeof param === "function" ? param(this.task) : param;
        /**
         * No need to update if nothing changed.
         */
        if (deepEqual(values, this.task)) {
            return;
        }
        this.task = await this.context.tasks.updateTask(this.task.id, {
            ...this.task,
            ...values
        });
    }

    public async updateValues<T extends ITaskDataValues = ITaskDataValues>(
        param: ITaskManagerStoreUpdateTaskValuesParam<T>
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

    public async addLog(log: ITaskDataLog): Promise<void> {
        this.task = await this.context.tasks.updateTask(this.task.id, {
            log: (this.task.log || []).concat([log])
        });
    }
}
