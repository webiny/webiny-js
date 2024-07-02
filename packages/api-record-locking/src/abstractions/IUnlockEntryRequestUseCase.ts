import { IRecordLockingLockRecord, IRecordLockingLockRecordEntryType } from "~/types";

export interface IUnlockEntryRequestUseCaseExecuteParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
}

export interface IUnlockEntryRequestUseCaseExecute {
    (params: IUnlockEntryRequestUseCaseExecuteParams): Promise<IRecordLockingLockRecord>;
}

export interface IUnlockEntryRequestUseCase {
    execute: IUnlockEntryRequestUseCaseExecute;
}
