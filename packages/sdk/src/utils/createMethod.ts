import type { ZodType } from "zod";
import type { WebinyConfig } from "../types.js";
import type { Result } from "../Result.js";
import type { ValidationError } from "../errors.js";
import { parseParams } from "./validateParams.js";

/**
 * Creates an SDK method that validates params against a Zod schema before running
 * the handler. If validation fails a ValidationError is returned immediately, with
 * no network request made.
 *
 * The handler receives the already-validated params object. Runtime type safety is
 * guaranteed by the Zod schema; TypeScript inference covers TResult and TError from
 * the handler's return type.
 *
 * Use this for methods whose params can be fully described by a Zod schema (scalars,
 * plain objects, arrays of primitives). Do NOT use it for methods whose params include
 * runtime-only types that Zod cannot validate — e.g. File, Buffer, Blob, AbortSignal,
 * callback functions. Those methods stay as plain async functions.
 */
export const createMethod = <TResult, TError>(
    schema: ZodType,
    handler: (
        config: WebinyConfig,
        fetchFn: typeof fetch,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params: any
    ) => Promise<Result<TResult, TError>>
): ((
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: unknown
) => Promise<Result<TResult, TError | ValidationError>>) => {
    return (config, fetchFn, params) => {
        const parsed = parseParams(schema, params);
        if (!parsed.ok) {
            return Promise.resolve(parsed.result);
        }
        return handler(config, fetchFn, parsed.data) as Promise<
            Result<TResult, TError | ValidationError>
        >;
    };
};
