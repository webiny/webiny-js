import type { IResponseResult } from "~/response/abstractions/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface ITaskManager {
    run: (definition: TaskDefinition.Runnable) => Promise<IResponseResult>;
}
