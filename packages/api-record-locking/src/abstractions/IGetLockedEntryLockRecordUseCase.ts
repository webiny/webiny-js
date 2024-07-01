import { IRecordLockingIsLockedParams, IRecordLockingLockRecord } from "~/types";

export type IGetLockedEntryLockRecordUseCaseExecuteParams = IRecordLockingIsLockedParams;

export interface IGetLockedEntryLockRecordUseCaseExecute {
    (
        params: IGetLockedEntryLockRecordUseCaseExecuteParams
    ): Promise<IRecordLockingLockRecord | null>;
}

export interface IGetLockedEntryLockRecordUseCase {
    execute: IGetLockedEntryLockRecordUseCaseExecute;
}
