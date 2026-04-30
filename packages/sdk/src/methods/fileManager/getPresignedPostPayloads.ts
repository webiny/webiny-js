import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError } from "../../errors.js";
import type { PresignedPostPayloadResponse } from "./fileManagerTypes.js";
import type { GetPresignedPostPayloadParams } from "./getPresignedPostPayload.js";

export interface GetPresignedPostPayloadsParams {
    files: GetPresignedPostPayloadParams[];
}

/**
 * Gets presigned POST payloads for uploading multiple files to S3.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for getting the presigned POST payloads
 * @param params.files - Array of file metadata for which to get presigned POST payloads
 * @returns Result containing the presigned POST payloads or an error
 */
export async function getPresignedPostPayloads(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: GetPresignedPostPayloadsParams
): Promise<Result<PresignedPostPayloadResponse[], HttpError | ApiError | NetworkError>> {
    const { files } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        query GetPreSignedPostPayloads($data: [PreSignedPostPayloadInput]!) {
            fileManager {
                getPreSignedPostPayloads(data: $data) {
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
        data: files.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            key: f.key,
            keyPrefix: f.keyPrefix
        }))
    });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.fileManager.getPreSignedPostPayloads.error) {
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.fileManager.getPreSignedPostPayloads.error.message,
                responseData.fileManager.getPreSignedPostPayloads.error.code
            )
        );
    }

    return Result.ok(responseData.fileManager.getPreSignedPostPayloads.data);
}
