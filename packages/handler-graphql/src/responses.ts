type ErrorResponseParams = {
    code?: string;
    message?: string;
    data?: any;
};

const defaultParams = {
    code: "",
    message: "",
    data: null
};

export class ErrorResponse {
    data: any;
    error: {
        code: string;
        message: string;
        data?: any;
    };
    constructor(params: ErrorResponseParams | Error | (Error & ErrorResponseParams)) {
        this.data = null;

        if (params instanceof Error) {
            // usually we don't use env variables directly inside code
            // but otherwise it would make it very tedious to pass this through multiple layers of code
            const debug = process.env.DEBUG === "true";

            this.error = {
                code: defaultParams.code,
                message: params.message || defaultParams.message,
                data: debug ? { stacktrace: params.stack } : defaultParams.data
            };

            if ("code" in params) {
                this.error.code = params.code;
            }

            if ("data" in params) {
                this.error.data = Object.assign(this.error.data || {}, params.data);
            }
        } else {
            this.error = {
                code: params.code || defaultParams.code,
                message: params.message || defaultParams.message,
                data: params.data || defaultParams.data
            };
        }
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
    data: null;
    meta: null;
    error: {
        code: string;
        message: string;
        data?: any;
    };
    constructor(params: ErrorResponseParams) {
        this.data = null;
        this.meta = null;
        this.error = {
            code: params.code || defaultParams.code,
            message: params.message || defaultParams.message,
            data: params.data || defaultParams.data
        };
    }
}

export class Response<T = any> {
    data: T;
    error: null;
    constructor(data: T) {
        this.data = data;
        this.error = null;
    }
}

export class ListResponse<T, M> {
    data: Array<T>;
    meta: M;
    error: null;
    constructor(data: Array<T>, meta?: M) {
        this.data = Array.isArray(data) ? data : [];
        this.meta = meta || ({} as M);
        this.error = null;
    }
}
