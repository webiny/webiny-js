import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { FileContents } from "~/features/file/GetFileContentsById/abstractions.js";
import { type FileNotFoundError, type FilePersistenceError } from "~/domain/file/errors.js";

export interface IGetFileContentsByKeyUseCase {
    execute(key: string): Promise<Result<FileContents, GetFileContentsByKeyError>>;
}

export interface IGetFileContentsByKeyUseCaseErrors {
    notFound: FileNotFoundError;
    persistence: FilePersistenceError;
}

type GetFileContentsByKeyError =
    IGetFileContentsByKeyUseCaseErrors[keyof IGetFileContentsByKeyUseCaseErrors];

export const GetFileContentsByKeyUseCase = createAbstraction<IGetFileContentsByKeyUseCase>(
    "GetFileContentsByKeyUseCase"
);

export namespace GetFileContentsByKeyUseCase {
    export type Interface = IGetFileContentsByKeyUseCase;
    export type Error = GetFileContentsByKeyError;
}
