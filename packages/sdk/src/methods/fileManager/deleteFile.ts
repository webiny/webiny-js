import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";

export interface DeleteFileParams {
    id: string;
}

/**
 * Deletes a file from the file manager.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for deleting the file
 * @param params.id - ID of the file to delete
 * @returns Result containing true on success or an error
 */
export async function deleteFile(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: DeleteFileParams
): Promise<Result<boolean, HttpError | GraphQLError | NetworkError>> {
    const { id } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        mutation DeleteFile($id: ID!) {
            fileManager {
                deleteFile(id: $id) {
                    data
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

    if (responseData.fileManager.deleteFile.error) {
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.fileManager.deleteFile.error.message,
                responseData.fileManager.deleteFile.error.code
            )
        );
    }

    return Result.ok(responseData.fileManager.deleteFile.data);
}
