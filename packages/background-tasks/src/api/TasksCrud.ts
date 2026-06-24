import { createAbstraction } from "@webiny/feature/api";
import type { ITasksContextCrudObject } from "~/api/types.js";

export const TasksCrud = createAbstraction<ITasksContextCrudObject>("Tasks/TasksCrud");

export namespace TasksCrud {
    export type Interface = ITasksContextCrudObject;
}
