import { ErrorResponse } from "@webiny/graphql/responses";

class NotAuthorizedResponse extends ErrorResponse {
    constructor() {
        super({
            message: "Not authorized!",
            code: "SECURITY_NOT_AUTHORIZED"
        });
    }
}

export default NotAuthorizedResponse;
