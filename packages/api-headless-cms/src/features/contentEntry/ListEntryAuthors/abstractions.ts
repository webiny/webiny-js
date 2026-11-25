import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";
import type {
    EntryNotAuthorizedError,
    EntryPersistenceError
} from "~/domain/contentEntry/errors.js";

export interface CmsEntryAuthor {
    id: string;
    displayName: string;
}

/**
 * ListEntryAuthors Use Case - lists the users who can read the entries of a model, so the
 * entry list can offer them as authors to filter by. Only the user's ID and name are returned.
 */
export interface IListEntryAuthorsUseCase {
    execute(model: CmsModel): Promise<Result<CmsEntryAuthor[], UseCaseError>>;
}

export interface IListEntryAuthorsUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    storage: EntryPersistenceError;
}

type UseCaseError = IListEntryAuthorsUseCaseErrors[keyof IListEntryAuthorsUseCaseErrors];

export const ListEntryAuthorsUseCase =
    createAbstraction<IListEntryAuthorsUseCase>("ListEntryAuthorsUseCase");

export namespace ListEntryAuthorsUseCase {
    export type Interface = IListEntryAuthorsUseCase;
    export type Author = CmsEntryAuthor;
    export type Error = UseCaseError;
    export type Return = Promise<Result<CmsEntryAuthor[], UseCaseError>>;
}
