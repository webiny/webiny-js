import { CreateFlpTask } from "./createFlp.task.js";
import { UpdateFlpTask } from "./updateFlp.task.js";
import { DeleteFlpTask } from "./deleteFlp.task.js";
import { SyncFlpTask } from "./syncFlp.task.js";
import { createContextPlugin } from "@webiny/api";

export const CREATE_FLP_TASK_ID = "acoCreateFlp";
export const DELETE_FLP_TASK_ID = "acoDeleteFlp";
export const UPDATE_FLP_TASK_ID = "acoUpdateFlp";
export const SYNC_FLP_TASK_ID = "acoSyncFlp";

export const flpTasks = () => {
    return [
        createContextPlugin(context => {
            context.container.register(CreateFlpTask);
            context.container.register(UpdateFlpTask);
            context.container.register(DeleteFlpTask);
            context.container.register(SyncFlpTask);
        })
    ];
};
