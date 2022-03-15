import WebinyError, { ErrorOptions } from "@webiny/error";

export default class NotAuthorizedError extends WebinyError<any> {
    constructor(params: ErrorOptions<any> = {}) {
        super({
            message: params.message || `Not authorized!`,
            code: params.code || `SECURITY_NOT_AUTHORIZED`,
            data: params.data
        });
    }
}
