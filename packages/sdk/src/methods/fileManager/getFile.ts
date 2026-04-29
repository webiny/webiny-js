import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError, ValidationError } from "../../errors.js";
import { parseParams } from "../../utils/validateParams.js";
import { getFileSchema } from "./schemas.js";
import type { FmFile } from "./fileManagerTypes.js";
import { buildFieldsSelection } from "./buildFieldsSelection.js";
import { transformFieldError } from "../../utils/transformFieldErrors.js";

export interface GetFileParams {
    id: string;
    fields: string[];
}

/**
 * Gets a single file from the file manager.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for getting the file
 * @param params.id - ID of the file to get
 * @returns Result containing the file data or an error
 */
export async function getFile(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: GetFileParams
): Promise<Result<FmFile, HttpError | GraphQLError | NetworkError | ValidationError>> {
    const parsed = parseParams(getFileSchema, params);
    if (!parsed.ok) return parsed.result;
    const { id, fields } = parsed.data;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const fieldsSelection = buildFieldsSelection(fields);

    const query = `
        query GetFile($id: ID!) {
            fileManager {
                getFile(id: $id) {
                    data {
${fieldsSelection}
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, { id });

    if (result.isFail()) {
        const { GraphQLError } = await import("../../errors.js");
        const error = result.error;
        if (error instanceof GraphQLError) {
            return Result.fail(
                new GraphQLError(transformFieldError(error.message, fields), error.data?.code)
            );
        }
        return Result.fail(error);
    }

    const responseData = result.value;

    if (responseData.fileManager.getFile.error) {
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.fileManager.getFile.error.message,
                responseData.fileManager.getFile.error.code
            )
        );
    }

    return Result.ok(responseData.fileManager.getFile.data);
}
