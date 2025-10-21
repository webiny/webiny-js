import { WebinyError } from "@webiny/error";
import type { GenericRecord } from "@webiny/api/types.js";

export const WORKFLOW_NOT_FOUND_ERROR_CODE = "WORKFLOW_NOT_FOUND";

interface IWorkflowNotFoundErrorParams {
    message?: string;
    code?: string;
    data?: GenericRecord;
}

export class WorkflowNotFoundError extends WebinyError {
    public constructor(id: string) {
        super({
            message: `Workflow with id "${id}" was not found.`,
            code: WORKFLOW_NOT_FOUND_ERROR_CODE,
            data: {
                id
            }
        });
    }
}
