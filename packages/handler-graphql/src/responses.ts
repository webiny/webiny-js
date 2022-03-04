export interface ErrorResponseParams {
    message: string;
    code?: string;
    data?: any;
    stack?: string | null;
}

const defaultParams: Required<ErrorResponseParams> = {
    code: "",
    message: "",
    data: null,
    stack: null
};

export class ErrorResponse {
    public readonly data: null;
    public readonly error: {
        code: string;
        message: string;
        data: any;
        stack: string | null;
    };

    constructor(params: ErrorResponseParams) {
        this.data = null;

        const debug = process.env.DEBUG === "true";

        // Ensure `stack` is either `string` or `null`.
        let stack = defaultParams.stack;
        if (debug && params.stack) {
            stack = params.stack;
        }

        this.error = {
            code: params.code || defaultParams.code,
            message: params.message || defaultParams.message,
            data: params.data || defaultParams.data,
            stack: stack
        };
    }
}

export class NotFoundResponse extends ErrorResponse {
    constructor(message: string) {
        super({
            code: "NOT_FOUND",
            message
        });
    }
}

export class ListErrorResponse {
    public readonly data: null;
    public readonly meta: null;
    public readonly error: {
        code: string;
        message: string;
        data: any;
        stack: string | null;
    };

    constructor(params: ErrorResponseParams) {
        this.meta = null;
        this.data = null;

        const debug = process.env.DEBUG === "true";

        // Ensure `stack` is either `string` or `null`.
        let stack = defaultParams.stack;
        if (debug && params.stack) {
            stack = params.stack;
        }

        this.error = {
            code: params.code || defaultParams.code,
            message: params.message || defaultParams.message,
            data: params.data || defaultParams.data,
            stack: stack
        };
    }
}

export class Response<T = any> {
    public readonly data: T;
    public readonly error: null;

    constructor(data: T) {
        this.data = data;
        this.error = null;
    }
}

export class ListResponse<T, M> {
    public readonly data: Array<T>;
    public readonly meta: M;
    public readonly error: null;

    constructor(data: Array<T>, meta?: M) {
        this.data = Array.isArray(data) ? data : [];
        this.meta = meta || ({} as M);
        this.error = null;
    }
}
