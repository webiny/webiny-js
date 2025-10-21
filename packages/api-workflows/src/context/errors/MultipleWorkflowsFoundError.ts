import { WebinyError } from "@webiny/error";
import type { GenericRecord } from "@webiny/api/types.js";

export const MULTIPLE_WORKFLOWS_FOUND_ERROR_CODE = "APP_MULTIPLE_WORKFLOWS_FOUND";

interface IMultipleWorkflowsFoundErrorParams {
    message?: string;
    code?: string;
    data?: GenericRecord;
}

export class MultipleWorkflowsFoundError extends WebinyError {
    public constructor(params?: IMultipleWorkflowsFoundErrorParams) {
        super({
            message: params?.message || "Multiple workflows found for the given app.",
            code: params?.code || MULTIPLE_WORKFLOWS_FOUND_ERROR_CODE,
            data: params?.data
        });
    }
}
