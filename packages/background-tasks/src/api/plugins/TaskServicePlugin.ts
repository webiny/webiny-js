import { Plugin } from "@webiny/plugins";
import { createAbstraction } from "@webiny/feature/api";
import type { ITask } from "~/api/types.js";

export interface ITaskServiceCreatePluginParams {
    getTenant(): string;
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

/**
 * DI multiple-abstraction for task-service transports (StepFunction / EventBridge / test mock).
 * Replaces the old `context.plugins.byType(TaskServicePlugin.type)` lookup in createService.
 */
export const TaskServiceTransport = createAbstraction<TaskServicePlugin>("TaskServiceTransport");
