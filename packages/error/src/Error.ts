interface ErrorOptions<TData> {
    message?: string;
    code?: string;
    data?: TData;
}

export default class WError<TData = any> extends Error {
    message: string;
    code?: string;
    data?: TData;
    constructor(message: string | ErrorOptions<TData>, code: string = null, data: TData = null) {
        super();

        if (typeof message === "string") {
            this.message = message;
            this.code = code;
            this.data = data;
        } else {
            Object.assign(this, message);
        }
    }

    static from<TData = any>(err: any, options: ErrorOptions<TData> = {}) {
        return new WError({
            message: err.message || options.message,
            code: err.code || options.code,
            data: Object.assign({}, err.data, options.data)
        });
    }
}
