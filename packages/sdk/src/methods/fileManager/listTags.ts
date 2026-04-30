import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError } from "../../errors.js";
import type { FmTag, FmTagsListWhereInput } from "./fileManagerTypes.js";

export interface ListTagsParams {
    where?: FmTagsListWhereInput;
}

/**
 * Lists tags from the file manager.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for listing tags
 * @param params.where - Filter conditions
 * @returns Result containing the list of tags or an error
 */
export async function listTags(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: ListTagsParams = {}
): Promise<Result<FmTag[], HttpError | ApiError | NetworkError>> {
    const { where } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        query ListTags($where: FmTagsListWhereInput) {
            fileManager {
                listTags(where: $where) {
                    data {
                        tag
                        count
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, { where });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.fileManager.listTags.error) {
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.fileManager.listTags.error.message,
                responseData.fileManager.listTags.error.code
            )
        );
    }

    return Result.ok(responseData.fileManager.listTags.data);
}
