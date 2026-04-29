import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";
import type {
    FmFile,
    FmFileListWhereInput,
    FmFileListSorter,
    FmListMeta
} from "./fileManagerTypes.js";
import { buildFieldsSelection } from "./buildFieldsSelection.js";
import { transformFieldError } from "../../utils/transformFieldErrors.js";

export interface ListFilesParams {
    search?: string;
    where?: FmFileListWhereInput;
    limit?: number;
    after?: string;
    sort?: FmFileListSorter[];
    fields: string[];
}

export interface ListFilesResult {
    data: FmFile[];
    meta: FmListMeta;
}

/**
 * Lists files from the file manager.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for listing files
 * @param params.search - Search query
 * @param params.where - Filter conditions
 * @param params.limit - Maximum number of items to return
 * @param params.after - Cursor for pagination
 * @param params.sort - Sort order
 * @returns Result containing the list of files or an error
 */
export async function listFiles(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: ListFilesParams
): Promise<Result<ListFilesResult, HttpError | GraphQLError | NetworkError>> {
    const { search, where, limit, after, sort, fields } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const fieldsSelection = buildFieldsSelection(fields);

    const query = `
        query ListFiles($search: String, $where: FmFileListWhereInput, $limit: Int, $after: String, $sort: [FmFileListSorter!]) {
            fileManager {
                listFiles(search: $search, where: $where, limit: $limit, after: $after, sort: $sort) {
                    data {
${fieldsSelection}
                    }
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, {
        search,
        where,
        limit,
        after,
        sort
    });

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

    if (responseData.fileManager.listFiles.error) {
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.fileManager.listFiles.error.message,
                responseData.fileManager.listFiles.error.code
            )
        );
    }

    return Result.ok({
        data: responseData.fileManager.listFiles.data,
        meta: responseData.fileManager.listFiles.meta
    });
}
