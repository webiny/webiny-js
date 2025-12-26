import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { LockRecordEntryType } from "~/domain/types.js";
import type { LockRecordPersistenceError } from "~/domain/errors.js";

// Input types
export interface IsEntryLockedInput {
    id: string;
    type: LockRecordEntryType;
}

/**
 * IsEntryLocked Use Case - Checks if an entry is locked by another user
 * Returns true if locked by someone else, false if not locked or locked by current user
 */
export interface IIsEntryLockedUseCase {
    execute(input: IsEntryLockedInput): Promise<Result<boolean, UseCaseError>>;
}

export interface IIsEntryLockedUseCaseErrors {
    persistence: LockRecordPersistenceError;
}

type UseCaseError = IIsEntryLockedUseCaseErrors[keyof IIsEntryLockedUseCaseErrors];

export const IsEntryLockedUseCase =
    createAbstraction<IIsEntryLockedUseCase>("IsEntryLockedUseCase");

export namespace IsEntryLockedUseCase {
    export type Interface = IIsEntryLockedUseCase;
    export type Error = UseCaseError;
}
