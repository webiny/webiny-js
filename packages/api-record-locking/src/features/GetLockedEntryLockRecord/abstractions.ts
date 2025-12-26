import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordEntryType } from "~/domain/types.js";
import type { LockRecordNotFoundError } from "~/domain/errors.js";

// Input type
export interface GetLockedEntryLockRecordInput {
    id: string;
    type: LockRecordEntryType;
}

/**
 * GetLockedEntryLockRecord Use Case
 * Returns lock record ONLY if entry is locked by someone OTHER than current user
 * Returns error if: not found, expired, or locked by current user
 */
export interface IGetLockedEntryLockRecordUseCase {
    execute(input: GetLockedEntryLockRecordInput): Promise<Result<ILockRecord, UseCaseError>>;
}

export interface IGetLockedEntryLockRecordUseCaseErrors {
    notFound: LockRecordNotFoundError;
}

type UseCaseError =
    IGetLockedEntryLockRecordUseCaseErrors[keyof IGetLockedEntryLockRecordUseCaseErrors];

export const GetLockedEntryLockRecordUseCase = createAbstraction<IGetLockedEntryLockRecordUseCase>(
    "GetLockedEntryLockRecordUseCase"
);

export namespace GetLockedEntryLockRecordUseCase {
    export type Interface = IGetLockedEntryLockRecordUseCase;
    export type Error = UseCaseError;
}
