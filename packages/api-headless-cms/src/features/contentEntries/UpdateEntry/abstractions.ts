import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsModel,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type {
    EntryNotFoundError,
    EntryStorageError,
    EntryValidationError,
    EntryLockedError
} from "~/domains/contentEntries/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";

/**
 * UpdateEntry Use Case
 */
export interface IUpdateEntryUseCase {
    execute(
        model: CmsModel,
        id: string,
        input: UpdateCmsEntryInput,
        metaInput?: GenericRecord,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<Result<CmsEntry, UseCaseError>>;
}

export interface IUpdateEntryUseCaseErrors {
    notAuthorized: NotAuthorizedError;
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
    storage: EntryStorageError;
}

type RepositoryError = IUpdateEntryRepositoryErrors[keyof IUpdateEntryRepositoryErrors];

export const UpdateEntryRepository = createAbstraction<IUpdateEntryRepository>(
    "UpdateEntryRepository"
);

export namespace UpdateEntryRepository {
    export type Interface = IUpdateEntryRepository;
    export type Error = RepositoryError;
}
