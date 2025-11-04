import { WebinyError } from "@webiny/error";
import type { GenericRecord } from "@webiny/api/types.js";

export const ACTIVE_STATE_EXISTS_ERROR_CODE = "ACTIVE_STATE_EXISTS";

interface IActiveStateExistsErrorParams {
    message?: string;
    code?: string;
    data?: GenericRecord;
}

export class ActiveStateExistsError extends WebinyError {
    public constructor(params?: IActiveStateExistsErrorParams) {
        super({
            message: params?.message || "Active workflow state already exists.",
            code: params?.code || ACTIVE_STATE_EXISTS_ERROR_CODE,
            data: params?.data
        });
    }
}
