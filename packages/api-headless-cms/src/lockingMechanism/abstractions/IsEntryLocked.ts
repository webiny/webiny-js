import { IHeadlessCmsLockingMechanismIsLockedParams } from "~/lockingMechanism/types";

export type IIsEntryLockedUseCaseExecuteParams = IHeadlessCmsLockingMechanismIsLockedParams;

export interface IIsEntryLockedUseCaseExecute {
    (params: IIsEntryLockedUseCaseExecuteParams): Promise<boolean>;
}

export interface IIsEntryLockedUseCase {
    execute: IIsEntryLockedUseCaseExecute;
}
