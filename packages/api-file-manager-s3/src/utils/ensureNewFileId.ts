import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { BaseError } from "@webiny/feature/api";
import type { FileData } from "@webiny/api-file-manager/features/upload/types.js";
import { getFileStorageKey } from "./getFileStorageKey.js";

class FileAlreadyExistsError extends BaseError<{ id: string }> {
    override readonly code = "FILE_ALREADY_EXISTS" as const;

    constructor(id: string) {
        super({ message: `A file with id "${id}" already exists.`, data: { id } });
    }
}

/**
 * The client may choose the file id. Uploading with an id that is already used would overwrite
 * the existing file, so refuse when anything is stored under that id's folder.
 */
export const ensureNewFileId = async (params: {
    s3: S3;
    bucket: string;
    file: FileData;
    tenantId: string;
    clientId: string | undefined;
}) => {
    const { s3, bucket, file, tenantId, clientId } = params;
    if (!clientId) {
        // Server-generated ids are unique.
        return;
    }

    const folder = file.key.slice(0, file.key.lastIndexOf("/") + 1);
    const result = await s3.listObjectsV2({
        Bucket: bucket,
        Prefix: getFileStorageKey(tenantId, folder),
        MaxKeys: 1
    });

    if (result.KeyCount) {
        throw new FileAlreadyExistsError(clientId);
    }
};
