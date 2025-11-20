import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordPersistenceError } from "~/domain/errors.js";
import type { CmsEntryListParams, CmsEntryMeta } from "@webiny/api-headless-cms/types";

// Input/Output types
export type ListAllLockRecordsInput = Pick<CmsEntryListParams, "where" | "limit" | "sort" | "after">;

export interface ListAllLockRecordsOutput {
    items: ILockRecord[];
    meta: CmsEntryMeta;
}

/**
 * ListAllLockRecords Use Case - Lists all lock records without filtering
 */
export interface IListAllLockRecordsUseCase {
    execute(input?: ListAllLockRecordsInput): Promise<Result<ListAllLockRecordsOutput, UseCaseError>>;
}

export interface IListAllLockRecordsUseCaseErrors {
    persistence: LockRecordPersistenceError;
}

type UseCaseError = IListAllLockRecordsUseCaseErrors[keyof IListAllLockRecordsUseCaseErrors];

export const ListAllLockRecordsUseCase = createAbstraction<IListAllLockRecordsUseCase>("ListAllLockRecordsUseCase");

export namespace ListAllLockRecordsUseCase {
    export type Interface = IListAllLockRecordsUseCase;
    export type Error = UseCaseError;
}

/**
 * ListAllLockRecordsRepository - Fetches all lock records from storage
 */
export interface IListAllLockRecordsRepository {
    execute(input?: ListAllLockRecordsInput): Promise<Result<ListAllLockRecordsOutput, RepositoryError>>;
}

export interface IListAllLockRecordsRepositoryErrors {
    persistence: LockRecordPersistenceError;
}

type RepositoryError = IListAllLockRecordsRepositoryErrors[keyof IListAllLockRecordsRepositoryErrors];

export const ListAllLockRecordsRepository = createAbstraction<IListAllLockRecordsRepository>("ListAllLockRecordsRepository");

export namespace ListAllLockRecordsRepository {
    export type Interface = IListAllLockRecordsRepository;
    export type Error = RepositoryError;
}
