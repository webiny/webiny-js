import { ErrorResponse } from "@webiny/handler-graphql/responses";

type NotAuthorizedResponseArgsType = {
    message?: string;
    code?: string;
    data?: any;
};
class NotAuthorizedResponse extends ErrorResponse {
    constructor({ message, code, data }: NotAuthorizedResponseArgsType = {}) {
        super({
            message: message || "Not authorized!",
            code: code || "SECURITY_NOT_AUTHORIZED",
            data
        });
    }
}

export default NotAuthorizedResponse;
