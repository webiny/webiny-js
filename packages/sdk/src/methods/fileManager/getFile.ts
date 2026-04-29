import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";
import type { FmFile } from "./fileManagerTypes.js";
import { buildFieldsSelection } from "./buildFieldsSelection.js";

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
): Promise<Result<FmFile, HttpError | GraphQLError | NetworkError>> {
    const { id, fields } = params;

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
        return Result.fail(result.error);
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
