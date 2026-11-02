import type { BaseError } from "@webiny/feature/api";
import type { IResponseError } from "@webiny/api-core/features/task/TaskDefinition/index.js";

/**
 * What a step run task stores as its error: the domain error's fixed message and code only. The
 * task output and its error log are readable through the background tasks API (D188), and
 * `DatabaseResponse` copies every own property of an error object, the non-enumerable raw
 * `source` of a persistence error included, so the error object itself is never passed (R146).
 * `data` is left out too: it can carry the review. Pure.
 */
export const toStepRunTaskError = (error: BaseError<unknown>): IResponseError => {
    return { message: error.message, code: error.code };
};
