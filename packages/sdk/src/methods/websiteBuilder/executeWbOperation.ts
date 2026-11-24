import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, NetworkError } from "../../errors.js";
import { ApiError } from "../../errors.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { transformFieldErrors } from "../../utils/transformFieldErrors.js";

interface WbOperationParams {
    /** "query" or "mutation". */
    type: "query" | "mutation";
    /** The operation's name in `websiteBuilder { … }`, e.g. "getPageById". */
    operation: string;
    /** Variable definitions, e.g. "$id: ID!, $raw: Boolean". */
    variableDefinitions?: string;
    /** Arguments passed to the operation, e.g. "id: $id, raw: $raw". */
    args?: string;
    /** Selection inside `data`; omitted for scalar results. */
    selection?: string;
    /** Also select `meta { cursor hasMoreItems totalCount }`. */
    withMeta?: boolean;
    variables?: Record<string, unknown>;
    /** The `fields` the caller asked for, to make field errors readable. */
    fields?: string[];
}

/**
 * Runs one `websiteBuilder { … }` operation and unwraps its `{ data, error, meta }` response.
 */
export const executeWbOperation = async <T>(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: WbOperationParams
): Promise<Result<{ data: T; meta?: any }, HttpError | ApiError | NetworkError>> => {
    const { type, operation, variableDefinitions, args, selection, withMeta, variables, fields } =
        params;
    const name = operation.charAt(0).toUpperCase() + operation.slice(1);
    const query = `
        ${type} Wb${name}${variableDefinitions ? `(${variableDefinitions})` : ""} {
            websiteBuilder {
                ${operation}${args ? `(${args})` : ""} {
                    data${selection ? ` {\n${selection}\n                    }` : ""}
                    ${withMeta ? "meta {\n                        cursor\n                        hasMoreItems\n                        totalCount\n                    }" : ""}
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, variables ?? {});

    if (result.isFail()) {
        const error = result.error;
        if (fields && error instanceof ApiError) {
            return Result.fail(
                new ApiError(transformFieldErrors(error.message, fields), error.data?.code)
            );
        }
        return Result.fail(error);
    }

    const response = result.value?.websiteBuilder?.[operation];
    if (!response) {
        return Result.fail(
            new ApiError(`Website Builder returned no response for "${operation}".`)
        );
    }
    if (response.error) {
        return Result.fail(new ApiError(response.error.message, response.error.code));
    }
    return Result.ok({ data: response.data as T, meta: response.meta });
};
