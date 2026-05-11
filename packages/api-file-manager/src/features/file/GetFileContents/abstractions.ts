import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import { type FileNotFoundError, type FilePersistenceError } from "~/domain/file/errors.js";

export interface FileContents {
    buffer: Buffer;
    contentType: string;
}

export interface IGetFileContentsUseCase {
    execute(fileId: string): Promise<Result<FileContents, GetFileContentsError>>;
}

export interface IGetFileContentsUseCaseErrors {
    notFound: FileNotFoundError;
    persistence: FilePersistenceError;
}

type GetFileContentsError = IGetFileContentsUseCaseErrors[keyof IGetFileContentsUseCaseErrors];

export const GetFileContentsUseCase =
    createAbstraction<IGetFileContentsUseCase>("GetFileContentsUseCase");

export namespace GetFileContentsUseCase {
    export type Interface = IGetFileContentsUseCase;
    export type Error = GetFileContentsError;
}
