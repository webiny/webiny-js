import { Result } from "../../Result.js";
import type { HttpError, NetworkError } from "../../errors.js";
import type { FmFile } from "./fileManagerTypes.js";
import { buildFieldsSelection } from "./buildFieldsSelection.js";
import { transformFieldErrors } from "../../utils/transformFieldErrors.js";
import { createMethod } from "../../utils/createMethod.js";
import { getFileSchema } from "./schemas.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

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
export const getFile = createMethod(
    getFileSchema,
    async (
        config,
        fetchFn,
        params
    ): Promise<Result<FmFile, HttpError | ApiError | NetworkError>> => {
        const { id, fields } = params;

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
            const error = result.error;
            if (error instanceof ApiError) {
                return Result.fail(
                    new ApiError(transformFieldErrors(error.message, fields), error.data?.code)
                );
            }
            return Result.fail(error);
        }

        const responseData = result.value;

        if (responseData.fileManager.getFile.error) {
            return Result.fail(
                new ApiError(
                    responseData.fileManager.getFile.error.message,
                    responseData.fileManager.getFile.error.code
                )
            );
        }

        return Result.ok(responseData.fileManager.getFile.data as FmFile);
    }
);
