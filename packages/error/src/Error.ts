export interface ErrorOptions<TData = any> {
    message?: string;
    code?: string;
    data?: TData;
}

export default class WError<TData = any> extends Error {
    public readonly code: string | null = null;
    public readonly data: TData | null = null;

    constructor(message: string, code?: string, data?: TData);
    constructor(options: ErrorOptions<TData>);
    constructor(messageOrOptions: string | ErrorOptions<TData>, code?: string, data?: TData) {
        // TODO in TS 4.6 we can move that into if statements
        super(typeof messageOrOptions === "string" ? messageOrOptions : messageOrOptions.message);

        if (typeof messageOrOptions === "string") {
            // super(messageOrOptions); - use after TS 4.6
            this.code = code || null;
            this.data = data || null;
        } else {
            // super(messageOrOptions.message); - use after TS 4.6
            this.code = messageOrOptions.code || null;
            this.data = messageOrOptions.data || null;
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
