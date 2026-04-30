import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, NetworkError } from "../../errors.js";
import type { FmFile, FmIdentity, FmLocationInput, UploadProgress } from "./fileManagerTypes.js";
import { getFileSize } from "./utils/fileTypeDetection.js";
import { buildFieldsSelection } from "./buildFieldsSelection.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";
import { getPresignedPostPayload } from "./getPresignedPostPayload.js";
import { uploadToS3 } from "./utils/uploadToS3.js";
import { uploadLargeFile } from "./utils/uploadLargeFile.js";

export interface CreateFileData {
    id?: string;
    createdOn?: Date | string;
    modifiedOn?: Date | string;
    savedOn?: Date | string;
    createdBy?: FmIdentity;
    modifiedBy?: FmIdentity;
    savedBy?: FmIdentity;
    location?: FmLocationInput;
    name?: string;
    key?: string;
    keyPrefix?: string;
    type?: string;
    size?: number;
    tags?: string[];
    [key: string]: any;
}

export interface CreateFileParams {
    file?: Buffer | Blob | File;
    data: CreateFileData;
    fields: string[];
    onProgress?: (progress: UploadProgress) => void;
    multiPartThreshold?: number;
    signal?: AbortSignal;
}

/**
 * Creates a new file in the file manager.
 * If a file is provided, it will be uploaded to S3 first, then the record is created.
 * If no file is provided, only the metadata record is created.
 *
 * @param config - SDK configuration
 * @param fetchFn - Fetch function to use for HTTP requests
 * @param params - Parameters for creating the file
 * @param params.file - Optional: The actual file content to upload
 * @param params.data - The file metadata
 * @param params.onProgress - Optional: Progress callback
 * @param params.multiPartThreshold - Optional: Threshold in MB for multi-part upload (default: 100)
 * @param params.signal - Optional: AbortSignal for cancellation
 * @returns Result containing the created file data or an error
 */
// Not using createMethod: params include File/Buffer/Blob, onProgress callback, and AbortSignal — types Zod cannot validate.
export async function createFile(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    params: CreateFileParams
): Promise<Result<FmFile, HttpError | ApiError | NetworkError>> {
    const { file, data, fields, onProgress, multiPartThreshold = 100, signal } = params;

    // If no file provided, just create metadata record (existing behavior).
    if (!file) {
        return createFileRecord(config, fetchFn, data, fields);
    }

    // File upload flow.
    try {
        const fileSize = getFileSize(file);
        const thresholdBytes = multiPartThreshold * 1024 * 1024;

        // Ensure we have required metadata for upload.
        if (!data.name || !data.type) {
            return Result.fail(new Error("File name and type are required for upload") as any);
        }

        // Decide upload strategy based on file size.
        if (fileSize < thresholdBytes) {
            // Simple upload.
            return await uploadSmallFile(config, fetchFn, file, data, fields, onProgress, signal);
        } else {
            // Multi-part upload.
            return await uploadLargeFileWrapper(
                config,
                fetchFn,
                file,
                data,
                fields,
                onProgress,
                signal
            );
        }
    } catch (error) {
        return Result.fail(error as any);
    }
}

/**
 * Uploads a small file using simple presigned POST.
 */
async function uploadSmallFile(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    file: Buffer | Blob | File,
    data: CreateFileData,
    fields: string[],
    onProgress?: (progress: UploadProgress) => void,
    signal?: AbortSignal
): Promise<Result<FmFile, HttpError | ApiError | NetworkError>> {
    // 1. Get presigned POST payload.
    const presignedResult = await getPresignedPostPayload(config, fetchFn, {
        name: data.name!,
        type: data.type!,
        size: getFileSize(file),
        key: data.key,
        keyPrefix: data.keyPrefix
    });

    if (presignedResult.isFail()) {
        return Result.fail(presignedResult.error);
    }

    // 2. Upload to S3.
    await uploadToS3(file, presignedResult.value.data, { onProgress, signal });

    // 3. Create file record with S3 key from presigned response.
    const fileMetadata: CreateFileData = {
        ...data,
        id: presignedResult.value.file.id,
        key: presignedResult.value.file.key,
        size: presignedResult.value.file.size
    };

    return createFileRecord(config, fetchFn, fileMetadata, fields);
}

/**
 * Uploads a large file using multi-part upload.
 */
async function uploadLargeFileWrapper(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    file: Buffer | Blob | File,
    data: CreateFileData,
    fields: string[],
    onProgress?: (progress: UploadProgress) => void,
    signal?: AbortSignal
): Promise<Result<FmFile, HttpError | ApiError | NetworkError>> {
    try {
        const uploadedFile = await uploadLargeFile(
            file,
            {
                name: data.name!,
                type: data.type!,
                size: getFileSize(file),
                key: data.key,
                keyPrefix: data.keyPrefix
            },
            config,
            fetchFn,
            { onProgress, signal, chunkSize: 50, parallelUploads: 5 }
        );

        // Create file record with uploaded metadata.
        const fileMetadata: CreateFileData = {
            ...data,
            id: uploadedFile.id,
            key: uploadedFile.key,
            size: uploadedFile.size
        };

        return createFileRecord(config, fetchFn, fileMetadata, fields);
    } catch (error) {
        return Result.fail(error as any);
    }
}

/**
 * Creates a file record via GraphQL (metadata only).
 */
async function createFileRecord(
    config: WebinyConfig,
    fetchFn: typeof fetch,
    data: CreateFileData,
    fields: string[]
): Promise<Result<FmFile, HttpError | ApiError | NetworkError>> {
    const fieldsSelection = buildFieldsSelection(fields);

    const query = `
        mutation CreateFile($data: FmFileCreateInput!) {
            fileManager {
                createFile(data: $data) {
                    data {
${fieldsSelection}
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, { data });

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.fileManager.createFile.error) {
        return Result.fail(
            new ApiError(
                responseData.fileManager.createFile.error.message,
                responseData.fileManager.createFile.error.code
            )
        );
    }

    return Result.ok(responseData.fileManager.createFile.data);
}
