import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError, ValidationError } from "../../errors.js";
import type { FmFile, FmIdentity, FmLocationInput } from "./fileManagerTypes.js";
import { buildFieldsSelection } from "./buildFieldsSelection.js";
import { parseParams } from "../../utils/validateParams.js";
import { updateFileSchema } from "./schemas.js";

export interface UpdateFileData {
    createdOn?: Date | string;
    modifiedOn?: Date | string;
    savedOn?: Date | string;
    createdBy?: FmIdentity;
    modifiedBy?: FmIdentity;
    savedBy?: FmIdentity;
    location?: FmLocationInput;
    name?: string;
    key?: string;
    type?: string;
    size?: number;
    tags?: string[];
    [key: string]: any;
}

export interface UpdateFileParams {
    id: string;
    data: UpdateFileData;
    fields: string[];
}

/**
 * Updates a file in the file manager.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for updating the file
 * @param params.id - ID of the file to update
 * @param params.data - The file data to update
 * @returns Result containing the updated file data or an error
 */
export async function updateFile(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: UpdateFileParams
): Promise<Result<FmFile, HttpError | ApiError | NetworkError | ValidationError>> {
    const parsed = parseParams(updateFileSchema, params);
    if (!parsed.ok) {
        return parsed.result;
    }
    const { id, data, fields } = parsed.data;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const fieldsSelection = buildFieldsSelection(fields);

    const query = `
        mutation UpdateFile($id: ID!, $data: FmFileUpdateInput!) {
            fileManager {
                updateFile(id: $id, data: $data) {
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

    const result = await executeGraphQL(config, fetchFn, query, { id, data });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.fileManager.updateFile.error) {
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.fileManager.updateFile.error.message,
                responseData.fileManager.updateFile.error.code
            )
        );
    }

    return Result.ok(responseData.fileManager.updateFile.data);
}
