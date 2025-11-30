import { createAbstraction } from "@webiny/feature/api";
import type { ITasksContextServiceObject } from "~/types.js";

export const TaskService = createAbstraction<ITasksContextServiceObject>("TaskService");

export namespace TaskService {
    export type Interface = ITasksContextServiceObject;
}
