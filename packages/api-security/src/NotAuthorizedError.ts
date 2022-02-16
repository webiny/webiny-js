import Error from "@webiny/error";

interface NotAuthorizedErrorArgsType {
    message: string;
    code: string;
    data: any;
}
class NotAuthorizedError extends Error {
    public data: any = null;
    constructor({ message, code, data }: Partial<NotAuthorizedErrorArgsType> = {}) {
        super(message || `Not authorized!`, code || `SECURITY_NOT_AUTHORIZED`);
        this.data = data || null;
    }
}

export default NotAuthorizedError;
