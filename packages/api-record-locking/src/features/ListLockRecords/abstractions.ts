import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordPersistenceError } from "~/domain/errors.js";
import type { CmsEntryListParams, CmsEntryMeta } from "@webiny/api-headless-cms/types";

// Input/Output types
export type ListLockRecordsInput = Pick<CmsEntryListParams, "where" | "limit" | "sort" | "after">;

export interface ListLockRecordsOutput {
    items: ILockRecord[];
    meta: CmsEntryMeta;
}

/**
 * ListLockRecords Use Case - Lists active lock records (filters out expired, excludes current user)
 */
export interface IListLockRecordsUseCase {
    execute(input?: ListLockRecordsInput): Promise<Result<ListLockRecordsOutput, UseCaseError>>;
}

export interface IListLockRecordsUseCaseErrors {
    persistence: LockRecordPersistenceError;
}

type UseCaseError = IListLockRecordsUseCaseErrors[keyof IListLockRecordsUseCaseErrors];

export const ListLockRecordsUseCase = createAbstraction<IListLockRecordsUseCase>("ListLockRecordsUseCase");

export namespace ListLockRecordsUseCase {
    export type Interface = IListLockRecordsUseCase;
    export type Error = UseCaseError;
}

/**
 * ListLockRecordsRepository - Fetches lock records from storage with filtering
 */
export interface IListLockRecordsRepository {
    execute(input?: ListLockRecordsInput): Promise<Result<ListLockRecordsOutput, RepositoryError>>;
}

export interface IListLockRecordsRepositoryErrors {
    persistence: LockRecordPersistenceError;
}

type RepositoryError = IListLockRecordsRepositoryErrors[keyof IListLockRecordsRepositoryErrors];

export const ListLockRecordsRepository = createAbstraction<IListLockRecordsRepository>("ListLockRecordsRepository");

export namespace ListLockRecordsRepository {
    export type Interface = IListLockRecordsRepository;
    export type Error = RepositoryError;
}
