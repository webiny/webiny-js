import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import { type FileNotFoundError, type FilePersistenceError } from "~/domain/file/errors.js";

export interface FileContents {
    buffer: Buffer;
    contentType: string;
}

export interface IGetFileContentsByIdUseCase {
    execute(fileId: string): Promise<Result<FileContents, GetFileContentsByIdError>>;
}

export interface IGetFileContentsByIdUseCaseErrors {
    notFound: FileNotFoundError;
    persistence: FilePersistenceError;
}

type GetFileContentsByIdError =
    IGetFileContentsByIdUseCaseErrors[keyof IGetFileContentsByIdUseCaseErrors];

export const GetFileContentsByIdUseCase = createAbstraction<IGetFileContentsByIdUseCase>(
    "GetFileContentsByIdUseCase"
);

export namespace GetFileContentsByIdUseCase {
    export type Interface = IGetFileContentsByIdUseCase;
    export type Error = GetFileContentsByIdError;
}
