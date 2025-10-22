/**
 * A container type that represents either a successful result (`ok`) or a failure (`fail`).
 * Inspired by functional programming constructs like `Either` or `Result` in other languages.
 *
 * @template TValue - The type of the success value.
 * @template TError - The type of the error value.
 */
export class Result<TValue, TError = never> {
    protected readonly _isOk: boolean;
    protected readonly _value?: TValue;
    protected readonly _error?: TError;

    private constructor(isOk: boolean, value?: TValue, error?: TError) {
        this._isOk = isOk;
        this._value = value;
        this._error = error;
    }

    /**
     * Creates a successful `Result` containing the provided value.
     *
     * @param value - The value to wrap in a successful result.
     * @returns A `Result` instance with the value.
     */
    public static ok<T>(value: T): Result<T, never> {
        return new Result<T, never>(true, value);
    }

    /**
     * Creates a failed `Result` containing the provided error.
     *
     * @param error - The error to wrap in a failed result.
     * @returns A `Result` instance with the error.
     */
    public static fail<E>(error: E): Result<never, E> {
        return new Result<never, E>(false, undefined, error);
    }

    /**
     * Checks whether the result is successful.
     *
     * @returns `true` if the result is `ok`, otherwise `false`.
     *          Acts as a type guard to narrow the type to a successful result.
     */
    public isOk(): this is { _value: TValue } & Result<TValue, TError> {
        return this._isOk;
    }

    /**
     * Checks whether the result is a failure.
     *
     * @returns `true` if the result is `fail`, otherwise `false`.
     *          Acts as a type guard to narrow the type to a failed result.
     */
    public isFail(): this is { _error: TError } & Result<TValue, TError> {
        return !this._isOk;
    }

    /**
     * Gets the value inside a successful result.
     *
     * @throws If the result is a failure.
     * @returns The success value.
     */
    public get value(): TValue {
        if (!this._isOk) {
            throw new Error("Tried to get value from a failed Result.");
        }

        return this._value as TValue;
    }

    /**
     * Gets the error inside a failed result.
     *
     * @throws If the result is successful.
     * @returns The error value.
     */
    public get error(): TError {
        if (this._isOk) {
            throw new Error("Tried to get error from a successful Result.");
        }

        return this._error as TError;
    }

    /**
     * Transforms the success value using the provided mapping function.
     *
     * @template U - The type of the new success value.
     * @param fn - Function to apply to the value if the result is successful.
     * @returns A new `Result` containing the mapped value, or the original error if failed.
     */
    public map<U>(fn: (value: TValue) => U): Result<U, TError> {
        if (this.isOk()) {
            return Result.ok(fn(this._value as TValue));
        }

        return Result.fail(this._error as TError);
    }

    /**
     * Transforms the error value using the provided mapping function.
     *
     * @template F - The type of the new error.
     * @param fn - Function to apply to the error if the result is a failure.
     * @returns A new `Result` containing the original value or the mapped error.
     */
    public mapError<F>(fn: (error: TError) => F): Result<TValue, F> {
        if (this.isFail()) {
            return Result.fail(fn(this._error as TError));
        }

        return Result.ok(this._value as TValue);
    }

    /**
     * Chains another `Result`-producing function onto this result.
     * If this result is successful, the function is applied to the value.
     * If this result is a failure, the original error is returned.
     *
     * @template U - The type of the next success value.
     * @param fn - A function that takes the current value and returns another `Result`.
     * @returns A new `Result` from applying the function or the original failure.
     */
    public flatMap<U>(fn: (value: TValue) => Result<U, TError>): Result<U, TError> {
        if (this.isOk()) {
            return fn(this._value as TValue);
        }

        return Result.fail(this._error as TError);
    }

    /**
     * Pattern-matches the result to handle both success and failure cases.
     *
     * @template U - The return type of both match functions.
     * @param handlers - An object containing `ok` and `fail` handlers.
     * @returns The return value from the corresponding handler.
     */
    public match<U>(handlers: { ok: (value: TValue) => U; fail: (error: TError) => U }): U {
        if (this.isOk()) {
            return handlers.ok(this._value as TValue);
        }

        return handlers.fail(this._error as TError);
    }
}
