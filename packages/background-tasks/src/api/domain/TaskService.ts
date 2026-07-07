import { createAbstraction } from "@webiny/feature/api";
import type { ITask } from "~/api/types.js";

export type ITaskServiceTask = Pick<ITask, "id" | "definitionId">;

export interface ITaskService {
    send(task: ITaskServiceTask, delay: number): Promise<unknown | null>;
    fetch(task: ITask): Promise<unknown | null>;
}

export const TaskService = createAbstraction<ITaskService>("BackgroundTasks/TaskService");

export namespace TaskService {
    export type Interface = ITaskService;
    export type SendTaskParams = ITaskServiceTask;
    export type Task = ITask;
}
