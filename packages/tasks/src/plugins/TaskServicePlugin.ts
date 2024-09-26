import { Plugin } from "@webiny/plugins";
import { Context, ITask } from "~/types";

export interface ITaskServiceCreatePluginParams {
    context: Context;
    getTenant(): string;
    getLocale(): string;
}

export type ITaskServiceTask = Pick<ITask, "id" | "definitionId">;

export interface ITaskService {
    send(task: ITaskServiceTask, delay: number): Promise<unknown | null>;
    fetch(task: ITask): Promise<unknown | null>;
}

export interface ITaskServicePluginParams {
    default?: boolean;
}

export abstract class TaskServicePlugin extends Plugin {
    public static override readonly type: string = "tasks.taskService";
    public readonly default: boolean;

    public constructor(params?: ITaskServicePluginParams) {
        super();
        this.default = !!params?.default;
    }

    public abstract createService(params: ITaskServiceCreatePluginParams): ITaskService;
}
