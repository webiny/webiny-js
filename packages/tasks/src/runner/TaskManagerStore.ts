import {
    ITaskData,
    ITaskDataInput,
    ITaskLog,
    ITaskLogItemType,
    ITaskManagerStoreInfoLog,
    ITasksContextObject,
    TaskDataStatus
} from "~/types";
import {
    ITaskManagerStore,
    ITaskManagerStoreErrorLog,
    ITaskManagerStoreUpdateTaskInputParam,
    ITaskManagerStoreUpdateTaskParam
} from "./abstractions";
/**
 * Package deep-equal does not have types.
 */
// @ts-expect-error
import deepEqual from "deep-equal";
import { getObjectProperties } from "~/runner/utils/getObjectProperties";

const getInput = <T extends ITaskDataInput = ITaskDataInput>(
    originalInput: T,
    input: ITaskManagerStoreUpdateTaskInputParam<T>
) => {
    if (typeof input === "function") {
        return input(originalInput);
    }
    return {
        ...originalInput,
        ...input
    };
};

export interface TaskManagerStoreContext {
    tasks: Pick<ITasksContextObject, "updateTask" | "updateLog">;
}

export class TaskManagerStore implements ITaskManagerStore {
    private readonly context: TaskManagerStoreContext;
    private task: ITaskData;
    private taskLog: ITaskLog;

    public constructor(context: TaskManagerStoreContext, task: ITaskData, log: ITaskLog) {
        this.context = context;
        this.task = task;
        this.taskLog = log;
    }

    public getStatus(): TaskDataStatus {
        return this.task.taskStatus;
    }

    public setTask(task: ITaskData): void {
        this.task = task;
    }

    public getTask<T extends ITaskDataInput = ITaskDataInput>(): ITaskData<T> {
        return this.task as ITaskData<T>;
    }

    public async updateTask(param: ITaskManagerStoreUpdateTaskParam): Promise<void> {
        const data = typeof param === "function" ? param(this.task) : param;
        /**
         * No need to update if nothing changed.
         */
        if (deepEqual(data, this.task)) {
            return;
        }
        this.task = await this.context.tasks.updateTask(this.task.id, {
            ...this.task,
            ...data
        });
    }

    public async updateInput<T extends ITaskDataInput = ITaskDataInput>(
        param: ITaskManagerStoreUpdateTaskInputParam<T>
    ): Promise<void> {
        const input = getInput<T>(this.task.input, param);

        /**
         * No need to update if nothing changed.
         */
        if (deepEqual(input, this.task.input)) {
            return;
        }
        this.task = await this.context.tasks.updateTask(this.task.id, {
            input
        });
    }

    public getInput<T extends ITaskDataInput = ITaskDataInput>(): T {
        return this.task.input as T;
    }

    public async addInfoLog(log: ITaskManagerStoreInfoLog): Promise<void> {
        this.taskLog = await this.context.tasks.updateLog(this.taskLog.id, {
            items: this.taskLog.items.concat([
                {
                    message: log.message,
                    data: log.data,
                    type: ITaskLogItemType.INFO,
                    createdOn: new Date().toISOString()
                }
            ])
        });
    }

    public async addErrorLog(log: ITaskManagerStoreErrorLog): Promise<void> {
        this.taskLog = await this.context.tasks.updateLog(this.taskLog.id, {
            items: this.taskLog.items.concat([
                {
                    message: log.message,
                    error: getObjectProperties(log.error),
                    type: ITaskLogItemType.ERROR,
                    createdOn: new Date().toISOString()
                }
            ])
        });
    }
}
