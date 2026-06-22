import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { File } from "~/domain/file/types.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";

export interface IGetFileByUrlUseCase {
    execute(url: string): Promise<Result<File | undefined, UseCaseError>>;
}

export interface IGetFileByUrlUseCaseErrors {
    notAuthorized: FileNotAuthorizedError;
}

type UseCaseError = IGetFileByUrlUseCaseErrors[keyof IGetFileByUrlUseCaseErrors];

/* Retrieve a file by its public URL. */
export const GetFileByUrlUseCase = createAbstraction<IGetFileByUrlUseCase>("GetFileByUrlUseCase");

export namespace GetFileByUrlUseCase {
    export type Interface = IGetFileByUrlUseCase;
    export type Error = UseCaseError;
}
