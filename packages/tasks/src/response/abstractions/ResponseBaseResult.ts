import { TaskResponseStatus } from "~/types";

export interface IResponseBaseResult {
    status: TaskResponseStatus;
    webinyTaskId: string;
    webinyTaskDefinitionId: string;
    tenant: string;
    locale: string;
}
