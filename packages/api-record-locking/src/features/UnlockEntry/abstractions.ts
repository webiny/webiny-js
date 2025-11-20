import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordEntryType } from "~/domain/types.js";
import {
    type LockRecordNotFoundError,
    LockRecordPersistenceError,
    type NotSameIdentityError,
    type UnlockEntryError
} from "~/domain/errors.js";

// Input types
export interface UnlockEntryInput {
    id: string;
    type: LockRecordEntryType;
    force?: boolean;
}

/**
 * UnlockEntry Use Case - Unlocks an entry by deleting the lock record
 */
export interface IUnlockEntryUseCase {
    execute(input: UnlockEntryInput): Promise<Result<ILockRecord, UseCaseError>>;
}

export interface IUnlockEntryUseCaseErrors {
    notFound: LockRecordNotFoundError;
    notSameIdentity: NotSameIdentityError;
    unlockError: UnlockEntryError;
    persistence: LockRecordPersistenceError;
}

type UseCaseError = IUnlockEntryUseCaseErrors[keyof IUnlockEntryUseCaseErrors];

export const UnlockEntryUseCase = createAbstraction<IUnlockEntryUseCase>("UnlockEntryUseCase");

export namespace UnlockEntryUseCase {
    export type Interface = IUnlockEntryUseCase;
    export type Error = UseCaseError;
}

/**
 * UnlockEntryRepository - Deletes lock record from storage
 */
export interface IUnlockEntryRepository {
    delete(lockRecordId: string): Promise<Result<void, RepositoryError>>;
}

export interface IUnlockEntryRepositoryErrors {
    notFound: LockRecordNotFoundError;
    unlockError: UnlockEntryError;
}

type RepositoryError = IUnlockEntryRepositoryErrors[keyof IUnlockEntryRepositoryErrors];

export const UnlockEntryRepository =
    createAbstraction<IUnlockEntryRepository>("UnlockEntryRepository");

export namespace UnlockEntryRepository {
    export type Interface = IUnlockEntryRepository;
    export type Error = RepositoryError;
}
