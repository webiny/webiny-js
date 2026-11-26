import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";
import type { EntryPersistenceError } from "~/domain/contentEntry/errors.js";

export interface CmsEntriesReader {
    id: string;
    displayName: string;
}

/**
 * ListUsersWhoCanReadEntries Use Case - lists the users who can read the entries of a model, so
 * the entry list can offer them as authors to filter by. It does not look at who created which
 * entry. Only the user's ID and name are returned.
 */
export interface IListUsersWhoCanReadEntriesUseCase {
    execute(modelId: string): Promise<Result<CmsEntriesReader[], UseCaseError>>;
}

export interface IListUsersWhoCanReadEntriesUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    storage: EntryPersistenceError;
}

type UseCaseError =
    IListUsersWhoCanReadEntriesUseCaseErrors[keyof IListUsersWhoCanReadEntriesUseCaseErrors];

export const ListUsersWhoCanReadEntriesUseCase =
    createAbstraction<IListUsersWhoCanReadEntriesUseCase>("ListUsersWhoCanReadEntriesUseCase");

export namespace ListUsersWhoCanReadEntriesUseCase {
    export type Interface = IListUsersWhoCanReadEntriesUseCase;
    export type Reader = CmsEntriesReader;
    export type Error = UseCaseError;
    export type Return = Promise<Result<CmsEntriesReader[], UseCaseError>>;
}
