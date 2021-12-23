interface ErrorOptions<TData> {
    message?: string;
    code?: string;
    data?: TData;
}

export default class WError<TData = any> extends Error {
    code?: string;
    data?: TData;

    constructor(message: string, code?: string, data?: TData);
    constructor(options: ErrorOptions<TData>);
    constructor(
        messageOrOptions: string | ErrorOptions<TData>,
        code: string = null,
        data: TData = null
    ) {
        if (typeof messageOrOptions === "string") {
            super(messageOrOptions);
            this.code = code;
            this.data = data;
        } else {
            super(messageOrOptions.message);
            this.code = messageOrOptions.code;
            this.data = messageOrOptions.data;
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
