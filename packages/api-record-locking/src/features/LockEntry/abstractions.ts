import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordEntryType } from "~/domain/types.js";
import type { EntryAlreadyLockedError, LockEntryError, LockRecordPersistenceError } from "~/domain/errors.js";

// Input types
export interface LockEntryInput {
    id: string;
    type: LockRecordEntryType;
}

/**
 * LockEntry Use Case - Creates a lock on an entry
 */
export interface ILockEntryUseCase {
    execute(input: LockEntryInput): Promise<Result<ILockRecord, UseCaseError>>;
}

export interface ILockEntryUseCaseErrors {
    alreadyLocked: EntryAlreadyLockedError;
    persistence: LockRecordPersistenceError;
    lockError: LockEntryError;
}

type UseCaseError = ILockEntryUseCaseErrors[keyof ILockEntryUseCaseErrors];

export const LockEntryUseCase = createAbstraction<ILockEntryUseCase>("LockEntryUseCase");

export namespace LockEntryUseCase {
    export type Interface = ILockEntryUseCase;
    export type Error = UseCaseError;
}

/**
 * LockEntryRepository - Creates lock record in storage
 */
export interface ILockEntryRepository {
    create(input: LockEntryInput): Promise<Result<ILockRecord, RepositoryError>>;
}

export interface ILockEntryRepositoryErrors {
    persistence: LockRecordPersistenceError;
}

type RepositoryError = ILockEntryRepositoryErrors[keyof ILockEntryRepositoryErrors];

export const LockEntryRepository = createAbstraction<ILockEntryRepository>("LockEntryRepository");

export namespace LockEntryRepository {
    export type Interface = ILockEntryRepository;
    export type Error = RepositoryError;
}
