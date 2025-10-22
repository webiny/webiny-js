import { WebinyError } from "@webiny/error";

export const WORKFLOW_NOT_FOUND_ERROR_CODE = "WORKFLOW_NOT_FOUND";

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
