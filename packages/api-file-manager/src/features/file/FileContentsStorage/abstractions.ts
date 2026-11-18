import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { FileAlreadyExistsError, FilePersistenceError } from "~/domain/file/errors.js";

export interface FileContentsStoragePutInput {
    /** The file's key, relative to the current tenant's files (`<id>/<name>`). */
    key: string;
    contents: Buffer;
    contentType: string;
}

export interface IFileContentsStorage {
    /**
     * Writes the bytes under the key. Never overwrites: when something is already stored under
     * the key, nothing is written and it fails with `alreadyExists`.
     */
    put(input: FileContentsStoragePutInput): Promise<Result<void, PutError>>;

    /** Deletes the bytes stored under the key. A key with nothing stored under it is not an error. */
    delete(key: string): Promise<Result<void, DeleteError>>;
}

export interface IFileContentsStoragePutErrors {
    alreadyExists: FileAlreadyExistsError;
    persistence: FilePersistenceError;
}

export interface IFileContentsStorageDeleteErrors {
    persistence: FilePersistenceError;
}

type PutError = IFileContentsStoragePutErrors[keyof IFileContentsStoragePutErrors];
type DeleteError = IFileContentsStorageDeleteErrors[keyof IFileContentsStorageDeleteErrors];

/**
 * Where File Manager keeps the current tenant's file bytes. Storage packages
 * (`api-file-manager-s3`, `api-file-manager-standalone`) implement it.
 *
 * Internal: it checks neither permissions nor size limits, and creates no file record.
 * Use `StoreFileUseCase` instead.
 */
export const FileContentsStorage = createAbstraction<IFileContentsStorage>(
    "FileManager/FileContentsStorage"
);

export namespace FileContentsStorage {
    export type Interface = IFileContentsStorage;
    export type PutInput = FileContentsStoragePutInput;
    export type PutError = IFileContentsStoragePutErrors[keyof IFileContentsStoragePutErrors];
    export type DeleteError =
        IFileContentsStorageDeleteErrors[keyof IFileContentsStorageDeleteErrors];
}
