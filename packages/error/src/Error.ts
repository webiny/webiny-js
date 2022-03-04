export interface ErrorOptions<TData = any> {
    message?: string;
    code?: string;
    data?: TData;
}

export default class WError<TData = any> extends Error {
    public override readonly message: string = "";
    public readonly code: string | null = null;
    public data: TData | null = null;

    public constructor(message: string | ErrorOptions<TData>, code?: string, data?: TData) {
        super();

        if (typeof message === "string") {
            this.message = message;
            this.code = code || null;
            this.data = data || null;
        } else {
            Object.assign(this, message);
        }
    }

    public static from<TData = any>(err: Partial<WError>, options: ErrorOptions<TData> = {}) {
        return new WError({
            message: err.message || options.message,
            code: err.code || options.code,
            data: Object.assign({}, err.data, options.data)
        });
    }
}
