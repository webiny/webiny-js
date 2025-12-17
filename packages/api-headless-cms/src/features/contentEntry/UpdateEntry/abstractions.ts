import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type {
    EntryNotFoundError,
    EntryPersistenceError,
    EntryValidationError,
    EntryLockedError
} from "~/domain/contentEntry/errors.js";
import type { EntryNotAuthorizedError } from "~/domain/contentEntry/errors.js";

/**
 * UpdateEntry Use Case
 */
export interface IUpdateEntryUseCase {
    execute<T = CmsEntryValues>(
        model: CmsModel,
        id: string,
        input: UpdateCmsEntryInput<T>,
        metaInput?: GenericRecord,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry<T>, UseCaseError>>;
}

export interface IUpdateEntryUseCaseErrors {
    notAuthorized: EntryNotAuthorizedError;
    notFound: EntryNotFoundError;
    locked: EntryLockedError;
    validation: EntryValidationError;
    repository: RepositoryError;
}

type UseCaseError = IUpdateEntryUseCaseErrors[keyof IUpdateEntryUseCaseErrors];

export const UpdateEntryUseCase = createAbstraction<IUpdateEntryUseCase>("UpdateEntryUseCase");

export namespace UpdateEntryUseCase {
    export type Interface = IUpdateEntryUseCase;
    export type Error = UseCaseError;
}

/**
 * UpdateEntryRepository - Persists entry updates to storage.
 * Takes a domain CmsEntry object and updates it.
 */
export interface IUpdateEntryRepository {
    execute(model: CmsModel, entry: CmsEntry): Promise<Result<void, RepositoryError>>;
}

export interface IUpdateEntryRepositoryErrors {
    storage: EntryPersistenceError;
}

type RepositoryError = IUpdateEntryRepositoryErrors[keyof IUpdateEntryRepositoryErrors];

export const UpdateEntryRepository =
    createAbstraction<IUpdateEntryRepository>("UpdateEntryRepository");

export namespace UpdateEntryRepository {
    export type Interface = IUpdateEntryRepository;
    export type Error = RepositoryError;
}
