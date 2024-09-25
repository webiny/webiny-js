import { Plugin } from "@webiny/plugins";
import { Context, ITask } from "~/types";
import { GenericRecord } from "@webiny/api/types";

export interface ITaskServiceCreatePluginParams {
    context: Context;
    getTenant(): string;
    getLocale(): string;
}

export type ITaskServiceTask = Pick<ITask, "id" | "definitionId">;

export interface ITaskService<T = GenericRecord> {
    send(task: ITaskServiceTask, delay: number): Promise<T>;
    fetch<R>(task: ITask): Promise<R | null>;
}

export interface ITaskServicePluginParams {
    default?: boolean;
}

export abstract class TaskServicePlugin<T = GenericRecord> extends Plugin {
    public static override readonly type: string = "tasks.taskService";
    public readonly default: boolean;

    public constructor(params?: ITaskServicePluginParams) {
        super();
        this.default = !!params?.default;
    }

    public abstract createService(params: ITaskServiceCreatePluginParams): ITaskService<T>;
}
