export interface ErrorOptions {
    stack?: string;
}

type ErrorDataWithOptionalData<TData> = TData extends void
    ? { message: string; data?: never }
    : { message: string; data: TData };

export abstract class BaseError<TData = void> extends Error {
    public abstract readonly code: string;
    public readonly data: TData extends void ? undefined : TData;

    protected constructor(input: ErrorDataWithOptionalData<TData>, options?: ErrorOptions) {
        super(input.message);
        this.stack = options?.stack;
        this.data = input.data as any;
    }
}
