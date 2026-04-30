import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError } from "../../errors.js";

export interface CreateMultiPartUploadParams {
    data: {
        name: string;
        type: string;
        size: number;
        key?: string;
        keyPrefix?: string;
    };
    numberOfParts: number;
}

export interface MultiPartUploadResponse {
    uploadId: string;
    file: {
        id: string;
        name: string;
        type: string;
        size: number;
        key: string;
    };
    parts: Array<{
        partNumber: number;
        url: string;
    }>;
}

/**
 * Creates a multi-part upload for a large file.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for creating the multi-part upload
 * @param params.data - File metadata
 * @param params.numberOfParts - Number of parts to split the file into
 * @returns Result containing the multi-part upload data or an error
 */
export async function createMultiPartUpload(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: CreateMultiPartUploadParams
): Promise<Result<MultiPartUploadResponse, HttpError | ApiError | NetworkError>> {
    const { data, numberOfParts } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        mutation CreateMultiPartUpload($data: PreSignedPostPayloadInput!, $numberOfParts: Number!) {
            fileManager {
                createMultiPartUpload(data: $data, numberOfParts: $numberOfParts) {
                    data {
                        uploadId
                        file {
                            id
                            name
                            type
                            size
                            key
                        }
                        parts {
                            partNumber
                            url
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

    const result = await executeGraphQL(config, fetchFn, query, { data, numberOfParts });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.fileManager.createMultiPartUpload.error) {
        const { ApiError } = await import("../../errors.js");
        return Result.fail(
            new ApiError(
                responseData.fileManager.createMultiPartUpload.error.message,
                responseData.fileManager.createMultiPartUpload.error.code
            )
        );
    }

    return Result.ok(responseData.fileManager.createMultiPartUpload.data);
}
