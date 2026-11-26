import { BaseError } from "@webiny/feature/api";
import type { ObjectStorage } from "@webiny/api-object-storage";
import type { FileData } from "@webiny/api-file-manager/features/upload/types.js";
import { toTenantFileKey } from "./toTenantFileKey.js";

class FileAlreadyExistsError extends BaseError<{ id: string }> {
    override readonly code = "FILE_ALREADY_EXISTS" as const;

    constructor(id: string) {
        super({ message: `A file with id "${id}" already exists.`, data: { id } });
    }
}

/**
 * The client may choose the file id. Uploading with an id that is already used would overwrite
 * the existing file, so refuse when anything is stored in that file's folder already (same as the
 * AWS file manager). Also refuses a file key outside the tenant's files.
 */
export const ensureNewFileId = async (params: {
    objectStorage: ObjectStorage.Interface;
    file: FileData;
    tenantId: string;
    clientId: string | undefined;
}): Promise<void> => {
    const { objectStorage, file, tenantId, clientId } = params;
    const objectKey = toTenantFileKey(tenantId, file.key);

    if (!clientId) {
        // Server-generated ids are unique.
        return;
    }

    const folderPrefix = objectKey.slice(0, objectKey.lastIndexOf("/") + 1);
    if (await objectStorage.hasPrefix(folderPrefix)) {
        throw new FileAlreadyExistsError(clientId);
    }
};
