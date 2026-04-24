import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";

export interface CompleteMultiPartUploadParams {
    fileKey: string;
    uploadId: string;
}

/**
 * Completes a multi-part upload.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for completing the multi-part upload
 * @param params.fileKey - S3 key of the uploaded file
 * @param params.uploadId - Upload ID from createMultiPartUpload
 * @returns Result containing true on success or an error
 */
export async function completeMultiPartUpload(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: CompleteMultiPartUploadParams
): Promise<Result<boolean, HttpError | GraphQLError | NetworkError>> {
    const { fileKey, uploadId } = params;

    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        mutation CompleteMultiPartUpload($fileKey: String!, $uploadId: String!) {
            fileManager {
                completeMultiPartUpload(fileKey: $fileKey, uploadId: $uploadId) {
                    data
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, { fileKey, uploadId });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.fileManager.completeMultiPartUpload.error) {
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.fileManager.completeMultiPartUpload.error.message,
                responseData.fileManager.completeMultiPartUpload.error.code
            )
        );
    }

    return Result.ok(responseData.fileManager.completeMultiPartUpload.data);
}
