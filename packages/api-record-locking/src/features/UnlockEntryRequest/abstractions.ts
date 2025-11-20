import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordEntryType } from "~/domain/types.js";
import type {
    EntryNotLockedError,
    UnlockRequestAlreadySentError,
    UnlockEntryRequestError,
    LockRecordPersistenceError
} from "~/domain/errors.js";

// Input type
export interface UnlockEntryRequestInput {
    id: string;
    type: LockRecordEntryType;
}

/**
 * UnlockEntryRequest Use Case - Adds unlock request to lock record
 */
export interface IUnlockEntryRequestUseCase {
    execute(input: UnlockEntryRequestInput): Promise<Result<ILockRecord, UseCaseError>>;
}

export interface IUnlockEntryRequestUseCaseErrors {
    notLocked: EntryNotLockedError;
    alreadySent: UnlockRequestAlreadySentError;
    persistence: LockRecordPersistenceError;
    requestError: UnlockEntryRequestError;
}

type UseCaseError = IUnlockEntryRequestUseCaseErrors[keyof IUnlockEntryRequestUseCaseErrors];

export const UnlockEntryRequestUseCase = createAbstraction<IUnlockEntryRequestUseCase>("UnlockEntryRequestUseCase");

export namespace UnlockEntryRequestUseCase {
    export type Interface = IUnlockEntryRequestUseCase;
    export type Error = UseCaseError;
}

/**
 * UnlockEntryRequestRepository - Updates lock record with unlock request
 */
export interface IUnlockEntryRequestRepository {
    update(record: ILockRecord): Promise<Result<ILockRecord, RepositoryError>>;
}

export interface IUnlockEntryRequestRepositoryErrors {
    persistence: UnlockEntryRequestError;
}

type RepositoryError = IUnlockEntryRequestRepositoryErrors[keyof IUnlockEntryRequestRepositoryErrors];

export const UnlockEntryRequestRepository = createAbstraction<IUnlockEntryRequestRepository>("UnlockEntryRequestRepository");

export namespace UnlockEntryRequestRepository {
    export type Interface = IUnlockEntryRequestRepository;
    export type Error = RepositoryError;
}
