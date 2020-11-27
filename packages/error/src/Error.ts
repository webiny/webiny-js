export default class WError<TData = any> extends Error {
    message: string;
    code?: string;
    data?: TData;
    constructor(message: string, code: string = null, data: TData = null) {
        super();
        this.message = message;
        this.code = code;
        this.data = data;
    }
}
