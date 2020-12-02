import Error from "@webiny/error";

class NotAuthorizedError extends Error {
    constructor() {
        super("Not authorized!", "SECURITY_NOT_AUTHORIZED")
    }
}

export default NotAuthorizedError;
