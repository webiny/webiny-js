import { IRecordLockingIsLockedParams } from "~/types";

export type IIsEntryLockedUseCaseExecuteParams = IRecordLockingIsLockedParams;

export interface IIsEntryLockedUseCaseExecute {
    (params: IIsEntryLockedUseCaseExecuteParams): Promise<boolean>;
}

export interface IIsEntryLockedUseCase {
    execute: IIsEntryLockedUseCaseExecute;
}
