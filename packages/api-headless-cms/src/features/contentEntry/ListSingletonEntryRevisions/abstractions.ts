import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues, CmsModel } from "~/types/index.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { GetRevisionsByEntryIdUseCase } from "~/features/contentEntry/GetRevisionsByEntryId/index.js";

/**
 * ListSingletonEntryRevisions Use Case
 *
 * Lists the revisions of the singleton entry.
 */
export interface IListSingletonEntryRevisionsUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>[], UseCaseError>>;
}

export interface IListSingletonEntryRevisionsUseCaseErrors {
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    delegate: GetRevisionsByEntryIdUseCase.Error;
}

type UseCaseError =
    IListSingletonEntryRevisionsUseCaseErrors[keyof IListSingletonEntryRevisionsUseCaseErrors];

/** Lists the revisions of the singleton entry. */
export const ListSingletonEntryRevisionsUseCase =
    createAbstraction<IListSingletonEntryRevisionsUseCase>("ListSingletonEntryRevisionsUseCase");

export namespace ListSingletonEntryRevisionsUseCase {
    export type Interface = IListSingletonEntryRevisionsUseCase;
    export type Error = UseCaseError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<CmsEntry<T>[], UseCaseError>
    >;
}
