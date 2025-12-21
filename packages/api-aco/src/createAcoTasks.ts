import { createContextPlugin } from "@webiny/api";
import { CreateFlpTask } from "~/flp/tasks/createFlp.task.js";
import { UpdateFlpTask } from "~/flp/tasks/updateFlp.task.js";
import { DeleteFlpTask } from "~/flp/tasks/deleteFlp.task.js";
import { SyncFlpTask } from "~/flp/tasks/syncFlp.task.js";

export const createAcoTasks = () => {
    return createContextPlugin(context => {
        context.container.register(CreateFlpTask);
        context.container.register(UpdateFlpTask);
        context.container.register(DeleteFlpTask);
        context.container.register(SyncFlpTask);
    });
};
