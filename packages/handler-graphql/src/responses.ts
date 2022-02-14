interface ErrorResponseParams {
    code?: string;
    message?: string;
    data?: any;
}

const defaultParams: Required<ErrorResponseParams> = {
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
    constructor(params: ErrorResponseParams) {
        this.data = null;
        this.error = {
            code: params.code || defaultParams.code,
            message: params.message || defaultParams.message,
            data: params.data || defaultParams.data
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
