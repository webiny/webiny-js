import { createAbstraction, Result } from "@webiny/feature/api";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordPersistenceError } from "~/domain/errors.js";
import type { CmsEntryListParams, CmsEntryMeta } from "@webiny/api-headless-cms/types";
import type {
    DateStringInterfaceGenerator,
    IdentityInterfaceGenerator,
    IdInterfaceGenerator
} from "@webiny/api";

// Input/Output types
export interface IListLockRecordsWhere
    extends IdInterfaceGenerator<"id">,
        IdentityInterfaceGenerator<"lockedBy">,
        IdentityInterfaceGenerator<"createdBy">,
        DateStringInterfaceGenerator<"lockedOn">,
        DateStringInterfaceGenerator<"updatedOn">,
        DateStringInterfaceGenerator<"savedOn">,
        DateStringInterfaceGenerator<"expiresOn"> {}

export interface ListLockRecordsInput extends Pick<CmsEntryListParams, "limit" | "sort" | "after"> {
    where?: IListLockRecordsWhere;
}

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

export const ListLockRecordsUseCase =
    createAbstraction<IListLockRecordsUseCase>("ListLockRecordsUseCase");

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

export const ListLockRecordsRepository = createAbstraction<IListLockRecordsRepository>(
    "ListLockRecordsRepository"
);

export namespace ListLockRecordsRepository {
    export type Interface = IListLockRecordsRepository;
    export type Error = RepositoryError;
}
