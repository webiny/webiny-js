import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordEntryType } from "~/domain/types.js";
import type { LockRecordNotFoundError, LockRecordPersistenceError, NotSameIdentityError, UpdateEntryLockError } from "~/domain/errors.js";

// Input types
export interface UpdateEntryLockInput {
    id: string;
    type: LockRecordEntryType;
}

/**
 * UpdateEntryLock Use Case - Updates lock timestamp to keep it alive
 */
export interface IUpdateEntryLockUseCase {
    execute(input: UpdateEntryLockInput): Promise<Result<ILockRecord, UseCaseError>>;
}

export interface IUpdateEntryLockUseCaseErrors {
    notFound: LockRecordNotFoundError;
    notSameIdentity: NotSameIdentityError;
    persistence: LockRecordPersistenceError;
    updateError: UpdateEntryLockError;
}

type UseCaseError = IUpdateEntryLockUseCaseErrors[keyof IUpdateEntryLockUseCaseErrors];

export const UpdateEntryLockUseCase = createAbstraction<IUpdateEntryLockUseCase>("UpdateEntryLockUseCase");

export namespace UpdateEntryLockUseCase {
    export type Interface = IUpdateEntryLockUseCase;
    export type Error = UseCaseError;
}

/**
 * UpdateEntryLockRepository - Updates lock record in storage
 */
export interface IUpdateEntryLockRepository {
    update(lockRecordId: string, updateOwner: boolean): Promise<Result<ILockRecord, RepositoryError>>;
}

export interface IUpdateEntryLockRepositoryErrors {
    persistence: LockRecordPersistenceError;
}

type RepositoryError = IUpdateEntryLockRepositoryErrors[keyof IUpdateEntryLockRepositoryErrors];

export const UpdateEntryLockRepository = createAbstraction<IUpdateEntryLockRepository>("UpdateEntryLockRepository");

export namespace UpdateEntryLockRepository {
    export type Interface = IUpdateEntryLockRepository;
    export type Error = RepositoryError;
}
