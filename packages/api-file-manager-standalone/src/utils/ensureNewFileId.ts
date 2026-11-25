import path from "node:path";
import { access } from "node:fs/promises";
import { BaseError } from "@webiny/feature/api";
import type { FileData } from "@webiny/api-file-manager/features/upload/types.js";
import { getFileStorageKey, resolveTenantFilePath } from "./storagePaths.js";

class FileAlreadyExistsError extends BaseError<{ id: string }> {
    override readonly code = "FILE_ALREADY_EXISTS" as const;

    constructor(id: string) {
        super({ message: `A file with id "${id}" already exists.`, data: { id } });
    }
}

const exists = async (filePath: string): Promise<boolean> => {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
};

/**
 * The client may choose the file id. Uploading with an id that is already used would overwrite
 * the existing file, so refuse when that id's folder already exists (same as the S3 storage).
 * Also refuses a file key that resolves outside the tenant's files folder.
 */
export const ensureNewFileId = async (params: {
    storagePath: string;
    file: FileData;
    tenantId: string;
    clientId: string | undefined;
}): Promise<void> => {
    const { storagePath, file, tenantId, clientId } = params;
    const filePath = resolveTenantFilePath(
        storagePath,
        tenantId,
        getFileStorageKey(tenantId, file.key)
    );

    if (!clientId) {
        // Server-generated ids are unique.
        return;
    }

    if (await exists(path.dirname(filePath))) {
        throw new FileAlreadyExistsError(clientId);
    }
};
