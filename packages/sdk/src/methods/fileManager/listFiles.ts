import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError, ValidationError } from "../../errors.js";
import type {
    FmFile,
    FmFileListWhereInput,
    FmFileListSorter,
    FmListMeta
} from "./fileManagerTypes.js";
import { buildFieldsSelection } from "./buildFieldsSelection.js";
import { transformFieldErrors } from "../../utils/transformFieldErrors.js";
import { createMethod } from "../../utils/createMethod.js";
import { listFilesSchema } from "./schemas.js";

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
export const listFiles = createMethod(
    listFilesSchema,
    async (
        config,
        fetchFn,
        params
    ): Promise<Result<ListFilesResult, HttpError | ApiError | NetworkError>> => {
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
            const { ApiError } = await import("../../errors.js");
            const error = result.error;
            if (error instanceof ApiError) {
                return Result.fail(
                    new ApiError(transformFieldErrors(error.message, fields), error.data?.code)
                );
            }
            return Result.fail(error);
        }

        const responseData = result.value;

        if (responseData.fileManager.listFiles.error) {
            const { ApiError } = await import("../../errors.js");
            return Result.fail(
                new ApiError(
                    responseData.fileManager.listFiles.error.message,
                    responseData.fileManager.listFiles.error.code
                )
            );
        }

        return Result.ok({
            data: responseData.fileManager.listFiles.data as FmFile[],
            meta: responseData.fileManager.listFiles.meta as FmListMeta
        });
    }
);
