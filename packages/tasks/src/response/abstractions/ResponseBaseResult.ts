import type { TaskResponseStatus } from "~/types.js";

export interface IResponseBaseResult {
    status: TaskResponseStatus;
    webinyTaskId: string;
    webinyTaskDefinitionId: string;
    tenant: string;
}
