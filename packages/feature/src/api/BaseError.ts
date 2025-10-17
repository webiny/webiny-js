export interface ErrorData<TData = any> {
    message: string;
    data: TData;
}

export interface ErrorOptions {
    stack?: string;
}

export abstract class BaseError<TData = Record<string, any>> extends Error {
    public abstract readonly code: string;
    public readonly data: TData;

    protected constructor(data: ErrorData<TData>, options?: ErrorOptions) {
        super(data.message);
        this.stack = options?.stack;
        this.data = data.data;
    }
}
