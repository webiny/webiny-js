import WebinyError from "@webiny/error";

interface NotAuthorizedErrorArgsType {
    message: string;
    code: string;
    data: any;
}
class NotAuthorizedError extends WebinyError<any> {
    constructor({ message, code, data }: Partial<NotAuthorizedErrorArgsType> = {}) {
        super(message || `Not authorized!`, code || `SECURITY_NOT_AUTHORIZED`);
        this.data = data || null;
    }
}

export default NotAuthorizedError;
