import type { Context } from "~/api/types.js";
import { WebinyError } from "@webiny/error";
import { TaskService } from "~/api/domain/TaskService.js";

export interface ICreateTransport {
    container: Context["container"];
}

export const createService = (params: ICreateTransport): TaskService.Interface => {
    const { container } = params;
    const service = container.resolveAll(TaskService);
    if (service.length === 0) {
        throw new WebinyError("Missing TaskService.", "TASK_SERVICE_ERROR");
    }
    return service[service.length - 1];
};
