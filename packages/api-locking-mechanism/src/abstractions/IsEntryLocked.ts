import { ILockingMechanismIsLockedParams, ILockingMechanismLockRecord } from "~/types";

export type IIsEntryLockedUseCaseExecuteParams = ILockingMechanismIsLockedParams;

export interface IIsEntryLockedUseCaseExecute {
    (params: IIsEntryLockedUseCaseExecuteParams): Promise<boolean>;
}

export interface IIsEntryLockedUseCase {
    execute: IIsEntryLockedUseCaseExecute;
}
