import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, ApiError, NetworkError } from "../../errors.js";
import type { FmFile, UploadProgress, BatchUploadStrategy } from "./fileManagerTypes.js";
import type { CreateFileData } from "./createFile.js";
import { createFile } from "./createFile.js";
import pMap from "p-map";

export interface CreateFilesParams {
    files: Array<{
        file?: Buffer | Blob | File;
        data: CreateFileData;
        fields: string[];
        onProgress?: (progress: UploadProgress) => void;
    }>;
    multiPartThreshold?: number;
    concurrency?: number;
    strategy?: BatchUploadStrategy;
    signal?: AbortSignal;
}

export interface CreateFilesResult {
    successful: FmFile[];
    failed: Array<{
        data: CreateFileData;
        error: Error;
    }>;
}

/**
 * Creates multiple files in the file manager.
 * If files are provided, they will be uploaded to S3 first, then records are created.
 * If no files are provided, only metadata records are created.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for creating the files
 * @param params.files - Array of files with their data
 * @param params.multiPartThreshold - Optional: Threshold in MB for multi-part upload (default: 100)
 * @param params.concurrency - Optional: Number of concurrent uploads (default: 5)
 * @param params.strategy - Optional: Batch upload strategy (default: FAIL_FAST)
 * @param params.signal - Optional: AbortSignal for cancellation
 * @returns Result containing the created files or an error
 */
// Not using createMethod: params include File/Buffer/Blob entries and a BatchUploadStrategy callback.
export async function createFiles(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: CreateFilesParams
): Promise<Result<CreateFilesResult, HttpError | ApiError | NetworkError>> {
    const {
        files,
        multiPartThreshold = 100,
        concurrency = 5,
        strategy = "fail-fast" as BatchUploadStrategy,
        signal
    } = params;

    const successful: FmFile[] = [];
    const failed: Array<{ data: CreateFileData; error: Error }> = [];

    // Use p-map for controlled concurrency.

    try {
        await pMap(
            files,
            async fileItem => {
                try {
                    // Check abort signal.
                    if (signal?.aborted) {
                        throw new Error("Upload aborted");
                    }

                    // Upload single file.
                    const result = await createFile(config, fetchFn, {
                        file: fileItem.file,
                        data: fileItem.data,
                        fields: fileItem.fields,
                        onProgress: fileItem.onProgress,
                        multiPartThreshold,
                        signal
                    });

                    if (result.isOk()) {
                        successful.push(result.value);
                    } else {
                        if (strategy === "fail-fast") {
                            throw result.error;
                        }
                        failed.push({ data: fileItem.data, error: result.error as Error });
                    }
                } catch (error) {
                    if (strategy === "fail-fast") {
                        throw error;
                    }
                    failed.push({ data: fileItem.data, error: error as Error });
                }
            },
            { concurrency }
        );

        return Result.ok({ successful, failed });
    } catch (error) {
        // Fail-fast: Return error immediately.
        return Result.fail(error as any);
    }
}
