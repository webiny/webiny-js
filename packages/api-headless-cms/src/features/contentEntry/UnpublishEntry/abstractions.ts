import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryValues } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import type { EntryNotFoundError } from "~/domain/contentEntry/errors.js";
import type { EntryPersistenceError } from "~/domain/contentEntry/errors.js";
import type { EntryValidationError } from "~/domain/contentEntry/errors.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * UnpublishEntry Use Case
 */
export interface IUnpublishEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IUnpublishEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    repository: RepositoryError;
}

type UseCaseError = IUnpublishEntryUseCaseErrors[keyof IUnpublishEntryUseCaseErrors];

export const UnpublishEntryUseCase =
    createAbstraction<IUnpublishEntryUseCase>("UnpublishEntryUseCase");

export namespace UnpublishEntryUseCase {
    export type Interface = IUnpublishEntryUseCase;
    export type Error = UseCaseError;
}

/**
 * UnpublishEntryRepository - Persists entry unpublish to storage.
 * Takes a domain CmsEntry object and unpublishes it.
 */
export interface IUnpublishEntryRepository {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        entry: CmsEntry<T>
    ): Promise<Result<CmsEntry<T>, RepositoryError>>;
}

export interface IUnpublishEntryRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError = IUnpublishEntryRepositoryErrors[keyof IUnpublishEntryRepositoryErrors];

export const UnpublishEntryRepository = createAbstraction<IUnpublishEntryRepository>(
    "UnpublishEntryRepository"
);

export namespace UnpublishEntryRepository {
    export type Interface = IUnpublishEntryRepository;
    export type Error = RepositoryError;
}
