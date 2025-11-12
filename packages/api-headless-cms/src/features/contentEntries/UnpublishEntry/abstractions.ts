import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsEntry } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import type { EntryNotFoundError } from "~/domains/contentEntries/errors.js";
import type { EntryStorageError } from "~/domains/contentEntries/errors.js";
import type { EntryValidationError } from "~/domains/contentEntries/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";

/**
 * UnpublishEntry Use Case
 */
export interface IUnpublishEntryUseCase {
    execute(model: CmsModel, id: string): Promise<Result<CmsEntry, UseCaseError>>;
}

export interface IUnpublishEntryUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    notFound: EntryNotFoundError;
    validation: EntryValidationError;
    repository: RepositoryError;
}

type UseCaseError = IUnpublishEntryUseCaseErrors[keyof IUnpublishEntryUseCaseErrors];

export const UnpublishEntryUseCase = createAbstraction<IUnpublishEntryUseCase>(
    "UnpublishEntryUseCase"
);

export namespace UnpublishEntryUseCase {
    export type Interface = IUnpublishEntryUseCase;
    export type Error = UseCaseError;
}

/**
 * UnpublishEntryRepository - Persists entry unpublish to storage.
 * Takes a domain CmsEntry object and unpublishes it.
 */
export interface IUnpublishEntryRepository {
    execute(model: CmsModel, entry: CmsEntry): Promise<Result<CmsEntry, RepositoryError>>;
}

export interface IUnpublishEntryRepositoryErrors {
    storage: EntryStorageError;
}

type RepositoryError = IUnpublishEntryRepositoryErrors[keyof IUnpublishEntryRepositoryErrors];

export const UnpublishEntryRepository = createAbstraction<IUnpublishEntryRepository>(
    "UnpublishEntryRepository"
);

export namespace UnpublishEntryRepository {
    export type Interface = IUnpublishEntryRepository;
    export type Error = RepositoryError;
}
