import { ILockingMechanismIsLockedParams, ILockingMechanismLockRecord } from "~/types";

export type IGetLockedEntryLockRecordUseCaseExecuteParams = ILockingMechanismIsLockedParams;

export interface IGetLockedEntryLockRecordUseCaseExecute {
    (
        params: IGetLockedEntryLockRecordUseCaseExecuteParams
    ): Promise<ILockingMechanismLockRecord | null>;
}

export interface IGetLockedEntryLockRecordUseCase {
    execute: IGetLockedEntryLockRecordUseCaseExecute;
}
