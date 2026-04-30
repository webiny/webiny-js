import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, NetworkError } from "../../errors.js";
import type { FmTag, FmTagsListWhereInput } from "./fileManagerTypes.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

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
        return Result.fail(
            new ApiError(
                responseData.fileManager.listTags.error.message,
                responseData.fileManager.listTags.error.code
            )
        );
    }

    return Result.ok(responseData.fileManager.listTags.data);
}
