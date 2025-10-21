import { WebinyError } from "@webiny/error";
import type { GenericRecord } from "@webiny/api/types.js";

export const WORKFLOW_STATE_NOT_FOUND_ERROR_CODE = "WORKFLOW_STATE_NOT_FOUND";

interface IWorkflowStateNotFoundErrorParams {
    message?: string;
    code?: string;
    data?: GenericRecord;
}

export class WorkflowStateNotFoundError extends WebinyError {
    public constructor(params?: IWorkflowStateNotFoundErrorParams) {
        super({
            message: params?.message || "No workflow state for given record.",
            code: params?.code || WORKFLOW_STATE_NOT_FOUND_ERROR_CODE,
            data: params?.data
        });
    }
}
