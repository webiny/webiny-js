import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordEntryType } from "~/domain/types.js";
import { LockRecordNotFoundError, type LockRecordPersistenceError } from "~/domain/errors.js";

// Input types
export interface GetLockRecordInput {
    id: string;
    type: LockRecordEntryType;
}

/**
 * GetLockRecord Use Case - Retrieves a lock record for a given entry
 */
export interface IGetLockRecordUseCase {
    execute(input: GetLockRecordInput): Promise<Result<ILockRecord, UseCaseError>>;
}

export interface IGetLockRecordUseCaseErrors {
    notFound: LockRecordNotFoundError;
    persistence: LockRecordPersistenceError;
}

type UseCaseError = IGetLockRecordUseCaseErrors[keyof IGetLockRecordUseCaseErrors];

export const GetLockRecordUseCase =
    createAbstraction<IGetLockRecordUseCase>("GetLockRecordUseCase");

export namespace GetLockRecordUseCase {
    export type Interface = IGetLockRecordUseCase;
    export type Error = UseCaseError;
}

/**
 * GetLockRecordRepository - Fetches lock record from storage
 */
export interface IGetLockRecordRepository {
    get(id: string): Promise<Result<ILockRecord, RepositoryError>>;
}

export interface IGetLockRecordRepositoryErrors {
    notFound: LockRecordNotFoundError;
    persistence: LockRecordPersistenceError;
}

type RepositoryError = IGetLockRecordRepositoryErrors[keyof IGetLockRecordRepositoryErrors];

export const GetLockRecordRepository =
    createAbstraction<IGetLockRecordRepository>("GetLockRecordRepository");

export namespace GetLockRecordRepository {
    export type Interface = IGetLockRecordRepository;
    export type Error = RepositoryError;
}
