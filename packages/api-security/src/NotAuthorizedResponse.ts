import { ErrorResponse } from "@webiny/handler-graphql/responses";

interface NotAuthorizedResponseArgsType {
    message: string;
    code: string | null;
    data: any | null;
}
class NotAuthorizedResponse extends ErrorResponse {
    constructor({ message, code, data }: Partial<NotAuthorizedResponseArgsType> = {}) {
        super({
            message: message || "Not authorized!",
            code: code || "SECURITY_NOT_AUTHORIZED",
            data
        });
    }
}

export default NotAuthorizedResponse;
