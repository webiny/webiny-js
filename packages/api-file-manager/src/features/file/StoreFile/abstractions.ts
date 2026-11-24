import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { File } from "~/domain/file/types.js";
import type { StoreFileInput } from "~/domain/file/StoreFileInput.js";
import type {
    FileAlreadyExistsError,
    FileNotAuthorizedError,
    FilePersistenceError,
    InvalidFileKeyError,
    InvalidFileSizeError
} from "~/domain/file/errors.js";

export interface StoreFileResult {
    file: File;
    /** The file's URL, ready to use (e.g. in page content). */
    url: string;
}

export interface IStoreFileUseCase {
    execute(input: StoreFileUseCase.Input): StoreFileUseCase.Return;
}

export interface IStoreFileUseCaseErrors {
    notAuthorized: FileNotAuthorizedError;
    invalidSize: InvalidFileSizeError;
    invalidKey: InvalidFileKeyError;
    alreadyExists: FileAlreadyExistsError;
    persistence: FilePersistenceError;
}

type UseCaseError = IStoreFileUseCaseErrors[keyof IStoreFileUseCaseErrors];

/**
 * Store a file the system produced itself (a generated image, a report): writes its bytes where
 * File Manager keeps the current tenant's files and creates its record, under the caller's identity.
 * The same permission checks, upload size settings and upload modifiers apply as to an upload.
 */
export const StoreFileUseCase = createAbstraction<IStoreFileUseCase>("StoreFileUseCase");

export namespace StoreFileUseCase {
    export type Interface = IStoreFileUseCase;
    export type Input = StoreFileInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<StoreFileResult, UseCaseError>>;
}
