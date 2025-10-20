import { WebinyError } from "@webiny/error";
import type { GenericRecord } from "@webiny/api/types.js";

export const WORKFLOWS_NOT_FOUND_ERROR_CODE = "WORKFLOWS_NOT_FOUND";

interface IWorkflowsNotFoundErrorParams {
    message?: string;
    code?: string;
    data?: GenericRecord;
}

export class WorkflowsNotFoundError extends WebinyError {
    public constructor(params?: IWorkflowsNotFoundErrorParams) {
        super({
            message: params?.message || "No workflows are defined for the given app.",
            code: params?.code || WORKFLOWS_NOT_FOUND_ERROR_CODE,
            data: params?.data
        });
    }
}
