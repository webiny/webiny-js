import {
    File,
    FileManagerFilesStorageOperations,
    FileManagerFilesStorageOperationsListResponse,
    FileManagerFilesStorageOperationsTagsResponse
} from "@webiny/api-file-manager/types";

/**
 * This class is here to satisfy TS interface, but it will always be overridden by CMS storage operations
 * within the `api-file-manager` package itself. This will remain here until we find a better approach to organizing
 * storage operations, and connecting app logic to CMS.
 */
export class FilesStorageOperations implements FileManagerFilesStorageOperations {
    create(): Promise<File> {
        throw new Error("api-file-manager-ddb does not implement the Files storage operations.");
    }

    createBatch(): Promise<File[]> {
        throw new Error("api-file-manager-ddb does not implement the Files storage operations.");
    }

    delete(): Promise<void> {
        throw new Error("api-file-manager-ddb does not implement the Files storage operations.");
    }

    get(): Promise<File | null> {
        throw new Error("api-file-manager-ddb does not implement the Files storage operations.");
    }

    list(): Promise<FileManagerFilesStorageOperationsListResponse> {
        throw new Error("api-file-manager-ddb does not implement the Files storage operations.");
    }

    tags(): Promise<FileManagerFilesStorageOperationsTagsResponse[]> {
        throw new Error("api-file-manager-ddb does not implement the Files storage operations.");
    }

    update(): Promise<File> {
        throw new Error("api-file-manager-ddb does not implement the Files storage operations.");
    }
}
