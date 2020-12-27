import Error from "@webiny/error";

type NotAuthorizedErrorArgsType = {
    message?: string;
    code?: string;
    data?: any;
};
class NotAuthorizedError extends Error {
    public data?: string;
    constructor({ message, code, data }: NotAuthorizedErrorArgsType = {}) {
        super(message || `Not authorized!`, code || `SECURITY_NOT_AUTHORIZED`);
        this.data = data;
    }
}

export default NotAuthorizedError;
