import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsModel, CmsEntryUniqueValue } from "~/types/index.js";
import type { EntryStorageError } from "~/domains/contentEntries/errors.js";
import type { NotAuthorizedError } from "~/utils/errors.js";
import type { FieldNotSearchableError, InvalidWhereConditionError } from "./errors.js";

export interface GetUniqueFieldValuesParams {
    where: {
        latest?: boolean;
        published?: boolean;
        createdBy?: string;
        [key: string]: any;
    };
    fieldId: string;
}

/**
 * GetUniqueFieldValues Use Case - Fetches unique values for a specific field.
 * Used for filtering/autocomplete in the UI.
 */
export interface IGetUniqueFieldValuesUseCase {
    execute(
        model: CmsModel,
        params: GetUniqueFieldValuesParams
    ): Promise<Result<CmsEntryUniqueValue[], UseCaseError>>;
}

export interface IGetUniqueFieldValuesUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    storage: EntryStorageError;
    fieldNotSearchable: FieldNotSearchableError;
    invalidWhere: InvalidWhereConditionError;
}

type UseCaseError =
    IGetUniqueFieldValuesUseCaseErrors[keyof IGetUniqueFieldValuesUseCaseErrors];

export const GetUniqueFieldValuesUseCase = createAbstraction<IGetUniqueFieldValuesUseCase>(
    "GetUniqueFieldValuesUseCase"
);

export namespace GetUniqueFieldValuesUseCase {
    export type Interface = IGetUniqueFieldValuesUseCase;
    export type Error = UseCaseError;
}

/**
 * GetUniqueFieldValuesRepository - Fetches unique field values from storage.
 */
export interface IGetUniqueFieldValuesRepository {
    execute(
        model: CmsModel,
        params: GetUniqueFieldValuesParams
    ): Promise<Result<CmsEntryUniqueValue[], RepositoryError>>;
}

export interface IGetUniqueFieldValuesRepositoryErrors {
    storage: EntryStorageError;
}

type RepositoryError =
    IGetUniqueFieldValuesRepositoryErrors[keyof IGetUniqueFieldValuesRepositoryErrors];

export const GetUniqueFieldValuesRepository = createAbstraction<IGetUniqueFieldValuesRepository>(
    "GetUniqueFieldValuesRepository"
);

export namespace GetUniqueFieldValuesRepository {
    export type Interface = IGetUniqueFieldValuesRepository;
    export type Error = RepositoryError;
}
