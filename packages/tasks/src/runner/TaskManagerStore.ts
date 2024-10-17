import {
    IListTaskParamsWhere,
    ITask,
    ITaskDataInput,
    ITaskLog,
    TaskLogItemType,
    ITaskManagerStoreInfoLog,
    ITaskManagerStorePrivate,
    ITaskManagerStoreSetOutputOptions,
    ITaskManagerStoreUpdateTaskInputOptions,
    ITaskManagerStoreUpdateTaskOptions,
    ITaskResponseDoneResultOutput,
    ITasksContextObject,
    TaskDataStatus
} from "~/types";
import {
    ITaskManagerStoreAddLogOptions,
    ITaskManagerStoreErrorLog,
    ITaskManagerStoreUpdateTaskInputParam,
    ITaskManagerStoreUpdateTaskParams
} from "./abstractions";
/**
 * Package deep-equal does not have types.
 */
// @ts-expect-error
import deepEqual from "deep-equal";
import { getObjectProperties } from "~/utils/getObjectProperties";
import { ObjectUpdater } from "~/utils/ObjectUpdater";
import { GenericRecord } from "@webiny/api/types";

const getInput = <T extends ITaskDataInput = ITaskDataInput>(
    originalInput: T,
    input: ITaskManagerStoreUpdateTaskInputParam<T>
): T => {
    if (typeof input === "function") {
        return input(originalInput);
    }
    return {
        ...originalInput,
        ...input
    };
};

export interface TaskManagerStoreContext {
    tasks: Pick<ITasksContextObject, "updateTask" | "updateLog" | "listTasks">;
}

export interface ITaskManagerStoreParams {
    context: TaskManagerStoreContext;
    task: ITask;
    log: ITaskLog;
    disableDatabaseLogs?: boolean;
}

export class TaskManagerStore<
    T extends ITaskDataInput = ITaskDataInput,
    O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
> implements ITaskManagerStorePrivate<T, O>
{
    private readonly context: TaskManagerStoreContext;
    private task: ITask<T, O>;
    private taskLog: ITaskLog;
    private readonly disableDatabaseLogs: boolean;

    private readonly taskUpdater = new ObjectUpdater<ITask<T, O>>();
    private readonly taskLogUpdater = new ObjectUpdater<ITaskLog>();

    public constructor(params: ITaskManagerStoreParams) {
        this.context = params.context;
        this.task = params.task as ITask<T, O>;
        this.taskLog = params.log;
        this.disableDatabaseLogs = !!params.disableDatabaseLogs;
    }

    public getStatus(): TaskDataStatus {
        return this.task.taskStatus;
    }

    public getTask(): ITask<T, O> {
        return this.task as ITask<T, O>;
    }

    public async listChildTasks<
        I = GenericRecord,
        O extends ITaskResponseDoneResultOutput = ITaskResponseDoneResultOutput
    >(definitionId?: string): Promise<ITask<I, O>[]> {
        const where: IListTaskParamsWhere = {
            parentId: this.task.id
        };
        if (definitionId) {
            where.definitionId = definitionId;
        }
        const result = await this.context.tasks.listTasks<I, O>({
            where,
            sort: ["createdOn_ASC"],
            limit: 1000000
        });
        return result.items;
    }

    public async updateTask(
        param: ITaskManagerStoreUpdateTaskParams<T, O>,
        options?: ITaskManagerStoreUpdateTaskOptions
    ): Promise<void> {
        const data = typeof param === "function" ? param(this.task) : param;

        /**
         * No need to update if nothing changed.
         */
        if (deepEqual(data, this.task)) {
            return;
        }

        this.taskUpdater.update(data);

        if (options?.save === false) {
            return;
        }
        await this.save();
    }

    public async updateInput(
        param: ITaskManagerStoreUpdateTaskInputParam<T>,
        options?: ITaskManagerStoreUpdateTaskInputOptions
    ): Promise<void> {
        const input = getInput<T>(this.task.input, param);

        /**
         * No need to update if nothing changed.
         */
        if (deepEqual(input, this.task.input)) {
            return;
        }
        this.taskUpdater.update({
            input: input as T
        });
        if (options?.save === false) {
            return;
        }
        await this.save();
    }

    public getInput(): T {
        return this.task.input as T;
    }

    public async updateOutput(
        values: Partial<O>,
        options: ITaskManagerStoreSetOutputOptions = {}
    ): Promise<void> {
        this.taskUpdater.update({
            output: values as O
        });
        if (options?.save === false) {
            return;
        }
        await this.save();
    }

    public getOutput(): O {
        return this.task.output as O;
    }
    /**
     * Currently the methods throws an error if something goes wrong during the database update.
     * TODO: Maybe we should wrap it into try/catch and return error if any?
     */
    public async addInfoLog(
        log: ITaskManagerStoreInfoLog,
        options?: ITaskManagerStoreAddLogOptions
    ): Promise<void> {
        if (this.disableDatabaseLogs) {
            return;
        }
        this.taskLogUpdater.update({
            items: [
                {
                    message: log.message,
                    data: log.data,
                    type: TaskLogItemType.INFO,
                    createdOn: new Date().toISOString()
                }
            ]
        });
        if (options?.save === false) {
            return;
        }

        await this.save();
    }
    /**
     * Currently the methods throws an error if something goes wrong during the database update.
     * TODO: Maybe we should wrap it into try/catch and return error if any?
     */
    public async addErrorLog(
        log: ITaskManagerStoreErrorLog,
        options?: ITaskManagerStoreAddLogOptions
    ): Promise<void> {
        if (this.disableDatabaseLogs) {
            return;
        }
        /**
         * Let's log the error to the console as well.
         */
        console.error(log.error);
        /**
         * Then update the log object.
         */
        this.taskLogUpdater.update({
            items: [
                {
                    message: log.message,
                    error: log.error instanceof Error ? getObjectProperties(log.error) : log.error,
                    type: TaskLogItemType.ERROR,
                    createdOn: new Date().toISOString()
                }
            ]
        });
        if (options?.save === false) {
            return;
        }
        await this.save();
    }

    public async save(): Promise<void> {
        /**
         * Update both task and the log, if anything to update.
         */
        if (this.taskUpdater.isDirty()) {
            this.task = await this.context.tasks.updateTask<T, O>(
                this.task.id,
                this.taskUpdater.fetch()
            );
        }
        if (this.disableDatabaseLogs) {
            return;
        }
        if (this.taskLogUpdater.isDirty()) {
            this.taskLog = await this.context.tasks.updateLog(
                this.taskLog.id,
                this.taskLogUpdater.fetch()
            );
        }
    }
}
