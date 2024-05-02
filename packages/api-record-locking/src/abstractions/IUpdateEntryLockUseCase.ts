import { IRecordLockingLockRecord, IRecordLockingLockRecordEntryType } from "~/types";

export interface IUpdateEntryLockUseCaseExecuteParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
}

export interface IUpdateEntryLockUseCaseExecute {
    (params: IUpdateEntryLockUseCaseExecuteParams): Promise<IRecordLockingLockRecord>;
}

export interface IUpdateEntryLockUseCase {
    execute: IUpdateEntryLockUseCaseExecute;
}
