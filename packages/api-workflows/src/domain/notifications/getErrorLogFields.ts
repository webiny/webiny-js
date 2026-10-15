/** What `getErrorLogFields` reads from a caught value: only these two, and only when strings. */
interface ErrorLike {
    code?: unknown;
    name?: unknown;
}

export interface ErrorLogFields {
    errorCode: string | undefined;
    errorName: string | undefined;
}

/**
 * The only parts of a caught value a notification log carries (R196): its `code` and `name`, and
 * only when they are strings. Never the message (it can embed addresses or tokens), never the
 * error object. A `BaseError` subclass reports `"Error"` as its name. Pure.
 */
export const getErrorLogFields = (error: unknown): ErrorLogFields => {
    const source: ErrorLike = typeof error === "object" && error !== null ? error : {};
    return {
        errorCode: typeof source.code === "string" ? source.code : undefined,
        errorName: typeof source.name === "string" ? source.name : undefined
    };
};
