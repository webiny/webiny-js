import { Result } from "./Result.js";

export class ResultAsync<TValue, TError = never> {
    constructor(private readonly promise: Promise<Result<TValue, TError>>) {}

    // Wrap a function returning a Promise<Result<T, E>>.
    public static from<T, E>(fn: () => Promise<Result<T, E>>): ResultAsync<T, E> {
        return new ResultAsync(fn());
    }

    // Wrap a successful value.
    public static ok<T>(value: T): ResultAsync<T, never> {
        return new ResultAsync(Promise.resolve(Result.ok(value)));
    }

    // Wrap a failure.
    public static fail<E>(error: E): ResultAsync<never, E> {
        return new ResultAsync(Promise.resolve(Result.fail(error)));
    }

    // Await the wrapped result.
    public async unwrap(): Promise<Result<TValue, TError>> {
        return this.promise;
    }

    // Transform the success value.
    public mapAsync<U>(fn: (value: TValue) => U | Promise<U>): ResultAsync<U, TError> {
        const newPromise = this.promise.then(async res => {
            if (res.isOk()) {
                return Result.ok(await fn(res.value));
            }

            return Result.fail(res.error);
        });

        return new ResultAsync(newPromise);
    }

    // Transform the error value.
    public mapErrorAsync<F>(fn: (error: TError) => F | Promise<F>): ResultAsync<TValue, F> {
        const newPromise = this.promise.then(async res => {
            if (res.isFail()) {
                return Result.fail(await fn(res.error));
            }

            return Result.ok(res.value);
        });

        return new ResultAsync(newPromise);
    }

    // Chain another async Result.
    public flatMapAsync<U>(fn: (value: TValue) => ResultAsync<U, TError>): ResultAsync<U, TError> {
        const newPromise = this.promise.then(async res => {
            if (res.isFail()) {
                return Result.fail(res.error);
            }

            return await fn(res.value).unwrap();
        });

        return new ResultAsync(newPromise);
    }

    // Match success/failure (like sync Result).
    public async match<U>(handlers: {
        ok: (value: TValue) => U;
        fail: (error: TError) => U;
    }): Promise<U> {
        const result = await this.unwrap();

        if (result.isOk()) {
            return handlers.ok(result.value);
        }

        return handlers.fail(result.error);
    }
}
