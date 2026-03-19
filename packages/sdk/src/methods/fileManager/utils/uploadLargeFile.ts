import type { WebinyConfig } from "../../../types.js";
import type { FmFile, UploadProgress } from "../fileManagerTypes.js";
import { isBrowser } from "../../../utils/platform.js";
import { isBuffer, isFile, getFileSize } from "./fileTypeDetection.js";

export interface UploadLargeFileOptions {
    onProgress?: (progress: UploadProgress) => void;
    signal?: AbortSignal;
    chunkSize?: number;
    parallelUploads?: number;
}

/**
 * Uploads a large file to S3 using multi-part upload.
 *
 * @param file - The file to upload (Buffer, Blob, or File)
 * @param fileData - File metadata
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param options - Upload options
 * @returns Promise that resolves with the uploaded file metadata
 */
export async function uploadLargeFile(
    file: Buffer | Blob | File,
    fileData: { name: string; type: string; size: number; key?: string; keyPrefix?: string },
    config: WebinyConfig,
    fetchFn: typeof fetch,
    options: UploadLargeFileOptions = {}
): Promise<FmFile> {
    const { onProgress, signal, chunkSize = 50, parallelUploads = 5 } = options;

    const fileSize = getFileSize(file);
    const chunkSizeBytes = Math.max(chunkSize * 1024 * 1024, 5 * 1024 * 1024);
    const numberOfParts = Math.ceil(fileSize / chunkSizeBytes);

    // 1. Create multi-part upload.
    const { createMultiPartUpload } = await import("../createMultiPartUpload.js");
    const createResult = await createMultiPartUpload(config, fetchFn, {
        data: fileData,
        numberOfParts
    });

    if (createResult.isFail()) {
        throw createResult.error;
    }

    const uploadData = createResult.value;
    const progressTracker = new Map<number, number>();

    // Helper to track progress.
    const updateProgress = () => {
        if (!onProgress) {
            return;
        }

        const uploaded = Array.from(progressTracker.values()).reduce(
            (sum, value) => sum + value,
            0
        );
        const uploadedSize = Math.min(uploaded, fileSize);

        onProgress({
            sent: uploadedSize,
            total: fileSize,
            percentage: Math.round((uploadedSize / fileSize) * 100)
        });
    };

    // 2. Upload parts in parallel.
    const pMap = (await import("p-map")).default;
    const pRetry = (await import("p-retry")).default;

    await pMap(
        uploadData.parts,
        async (part: { partNumber: number; url: string }) => {
            // Check abort signal.
            if (signal?.aborted) {
                throw new Error("Upload aborted");
            }

            // Upload part with retry.
            await pRetry(
                async () => {
                    const chunk = await getFileChunk(
                        file,
                        part.partNumber,
                        chunkSizeBytes,
                        fileData.type
                    );

                    await uploadPart(
                        part.url,
                        chunk,
                        loaded => {
                            progressTracker.set(part.partNumber, loaded);
                            updateProgress();
                        },
                        signal
                    );
                },
                {
                    retries: 5,
                    minTimeout: 1500,
                    maxTimeout: 30000,
                    maxRetryTime: 300000
                }
            );
        },
        { concurrency: Math.min(numberOfParts, parallelUploads) }
    );

    // 3. Complete multi-part upload.
    const { completeMultiPartUpload } = await import("../completeMultiPartUpload.js");
    const completeResult = await completeMultiPartUpload(config, fetchFn, {
        fileKey: uploadData.file.key,
        uploadId: uploadData.uploadId
    });

    if (completeResult.isFail()) {
        throw completeResult.error;
    }

    // Return the file metadata.
    return uploadData.file as FmFile;
}

/**
 * Gets a chunk of the file for a specific part number.
 */
async function getFileChunk(
    file: Buffer | Blob | File,
    partNumber: number,
    chunkSize: number,
    fileType: string
): Promise<Blob | Buffer> {
    const start = (partNumber - 1) * chunkSize;
    const end = Math.min(start + chunkSize, getFileSize(file));

    if (isBuffer(file)) {
        return file.slice(start, end);
    }

    if (isFile(file) || file instanceof Blob) {
        return file.slice(start, end, fileType);
    }

    throw new Error("Unsupported file type");
}

/**
 * Uploads a single part to S3.
 */
async function uploadPart(
    url: string,
    chunk: Blob | Buffer,
    onProgress: (loaded: number) => void,
    signal?: AbortSignal
): Promise<void> {
    if (isBrowser && typeof XMLHttpRequest !== "undefined") {
        return uploadPartWithXHR(url, chunk, onProgress, signal);
    }

    return uploadPartWithFetch(url, chunk, signal);
}

/**
 * Upload part using XMLHttpRequest (browser only, supports progress).
 */
function uploadPartWithXHR(
    url: string,
    chunk: Blob | Buffer,
    onProgress: (loaded: number) => void,
    signal?: AbortSignal
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Handle abort signal.
        if (signal) {
            signal.addEventListener("abort", () => xhr.abort());
        }

        // Track upload progress.
        xhr.upload.addEventListener("progress", (event: ProgressEvent) => {
            if (event.lengthComputable) {
                onProgress(event.loaded);
            }
        });

        // Handle completion.
        xhr.addEventListener("readystatechange", () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                resolve();
            }
        });

        // Handle errors.
        xhr.addEventListener("error", () => {
            reject(new Error("Part upload failed due to network error"));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Part upload aborted"));
        });

        xhr.addEventListener("timeout", () => {
            reject(new Error("Part upload timed out"));
        });

        // Convert Buffer to Blob if needed.
        let body: Blob;
        if (isBuffer(chunk)) {
            // Buffer is a Uint8Array, so we can pass it to Blob.
            // Use 'as any' to work around TypeScript's strict type checking for ArrayBufferLike.
            body = new Blob([chunk as any]);
        } else {
            body = chunk;
        }

        // Send request.
        xhr.open("PUT", url);
        xhr.send(body);
    });
}

/**
 * Upload part using fetch (Node.js and browser).
 */
async function uploadPartWithFetch(
    url: string,
    chunk: Blob | Buffer,
    signal?: AbortSignal
): Promise<void> {
    const response = await fetch(url, {
        method: "PUT",
        body: chunk as any,
        signal
    });

    if (response.status !== 200) {
        const text = await response.text();
        throw new Error(`Part upload failed with status ${response.status}: ${text}`);
    }
}
