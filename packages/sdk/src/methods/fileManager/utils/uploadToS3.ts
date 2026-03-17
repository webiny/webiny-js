import type { PresignedPostPayload, UploadProgress } from "../fileManagerTypes.js";
import { isBrowser } from "../../../utils/platform.js";
import { isBuffer } from "./fileTypeDetection.js";

export interface UploadToS3Options {
    onProgress?: (progress: UploadProgress) => void;
    signal?: AbortSignal;
}

/**
 * Uploads a file to S3 using a presigned POST payload.
 *
 * @param file - The file to upload (Buffer, Blob, or File)
 * @param presignedPost - The presigned POST payload from S3
 * @param options - Upload options (progress callback, abort signal)
 * @returns Promise that resolves when upload is complete
 */
export async function uploadToS3(
    file: Buffer | Blob | File,
    presignedPost: PresignedPostPayload,
    options: UploadToS3Options = {}
): Promise<void> {
    const { onProgress, signal } = options;

    // Build FormData.
    const formData = new FormData();

    // Append all presigned POST fields.
    for (const [key, value] of Object.entries(presignedPost.fields)) {
        formData.append(key, value);
    }

    // Append the file.
    if (isBuffer(file)) {
        // Convert Buffer to Blob for FormData.
        // Buffer is a Uint8Array, so we can pass it to Blob.
        // Use 'as any' to work around TypeScript's strict type checking for ArrayBufferLike.
        formData.append("file", new Blob([file as any]));
    } else {
        formData.append("file", file);
    }

    // Use XMLHttpRequest in browser for progress tracking.
    if (isBrowser && onProgress) {
        return uploadWithXHR(presignedPost.url, formData, onProgress, signal);
    }

    // Use fetch in Node.js or browser without progress.
    return uploadWithFetch(presignedPost.url, formData, signal);
}

/**
 * Upload using XMLHttpRequest (browser only, supports progress).
 */
function uploadWithXHR(
    url: string,
    formData: FormData,
    onProgress: (progress: UploadProgress) => void,
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
                onProgress({
                    sent: event.loaded,
                    total: event.total,
                    percentage: Math.round((event.loaded / event.total) * 100)
                });
            }
        });

        // Handle completion.
        xhr.addEventListener("load", () => {
            if (xhr.status === 204) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
            }
        });

        // Handle errors.
        xhr.addEventListener("error", () => {
            reject(new Error("Upload failed due to network error"));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload aborted"));
        });

        // Send request.
        xhr.open("POST", url, true);
        xhr.send(formData);
    });
}

/**
 * Upload using fetch (Node.js and browser).
 */
async function uploadWithFetch(
    url: string,
    formData: FormData,
    signal?: AbortSignal
): Promise<void> {
    const response = await fetch(url, {
        method: "POST",
        body: formData,
        signal
    });

    if (response.status !== 204) {
        const text = await response.text();
        throw new Error(`Upload failed with status ${response.status}: ${text}`);
    }
}
