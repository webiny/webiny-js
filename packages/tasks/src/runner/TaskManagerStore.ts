import {
    ITaskData,
    ITaskDataLog,
    ITaskDataInput,
    ITasksContextObject,
    TaskDataStatus
} from "~/types";
import {
    ITaskManagerStore,
    ITaskManagerStoreUpdateTaskParam,
    ITaskManagerStoreUpdateTaskInputParam
} from "./abstractions";
/**
 * Package deep-equal does not have types.
 */
// @ts-expect-error
import deepEqual from "deep-equal";

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

    public async addLog(log: Omit<ITaskDataLog, "createdOn">): Promise<void> {
        this.task = await this.context.tasks.updateTask(this.task.id, {
            log: this.task.log.concat([
                {
                    ...log,
                    createdOn: new Date().toISOString()
                }
            ])
        });
    }
}
