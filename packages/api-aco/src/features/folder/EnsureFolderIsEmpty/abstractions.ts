import { createAbstraction, Result } from "@webiny/feature/api";
import { FolderNotAuthorizedError, FolderNotEmptyError } from "~/domain/folder/errors.js";

export interface IHasContentCallback {
    (): boolean | Promise<boolean>;
}

export interface IEnsureFolderIsEmpty {
    execute(
        type: string,
        id: string,
        hasContentCallback: IHasContentCallback
    ): Promise<Result<void, UseCaseError>>;
}

export interface IEnsureFolderIsEmptyError {
    notAuthorized: FolderNotAuthorizedError;
    notEmpty: FolderNotEmptyError;
}

type UseCaseError = IEnsureFolderIsEmptyError[keyof IEnsureFolderIsEmptyError];

/** Verify a folder has no children before deletion. */
export const EnsureFolderIsEmpty = createAbstraction<IEnsureFolderIsEmpty>("EnsureFolderIsEmpty");

export namespace EnsureFolderIsEmpty {
    export type Interface = IEnsureFolderIsEmpty;
    export type HasContentCallback = IHasContentCallback;
    export type Return = Promise<Result<void, UseCaseError>>;
}
