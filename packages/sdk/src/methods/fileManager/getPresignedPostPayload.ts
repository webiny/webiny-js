import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError } from "../../errors.js";
import type { PresignedPostPayloadResponse } from "./fileManagerTypes.js";

export interface GetPresignedPostPayloadParams {
    name: string;
    type: string;
    size: number;
    key?: string;
    keyPrefix?: string;
}

/**
 * Gets a presigned POST payload for uploading a file to S3.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for getting the presigned POST payload
 * @param params.name - File name
 * @param params.type - File MIME type
 * @param params.size - File size in bytes
 * @param params.key - Optional custom S3 key
 * @param params.keyPrefix - Optional custom key prefix
 * @returns Result containing the presigned POST payload or an error
 */
export async function getPresignedPostPayload(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: GetPresignedPostPayloadParams
): Promise<Result<PresignedPostPayloadResponse, HttpError | ApiError | NetworkError>> {
    const { name, type, size, key, keyPrefix } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        query GetPreSignedPostPayload($data: PreSignedPostPayloadInput!) {
            fileManager {
                getPreSignedPostPayload(data: $data) {
                    data {
                        data
                        file {
                            id
                            name
                            type
                            size
                            key
                        }
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
        data: { name, type, size, key, keyPrefix }
    });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.fileManager.getPreSignedPostPayload.error) {
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.fileManager.getPreSignedPostPayload.error.message,
                responseData.fileManager.getPreSignedPostPayload.error.code
            )
        );
    }

    return Result.ok(responseData.fileManager.getPreSignedPostPayload.data);
}
