import { IRecordLockingLockRecord, IRecordLockingLockRecordEntryType } from "~/types";

export interface ILockEntryUseCaseExecuteParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
}

export interface ILockEntryUseCaseExecute {
    (params: ILockEntryUseCaseExecuteParams): Promise<IRecordLockingLockRecord>;
}

export interface ILockEntryUseCase {
    execute: ILockEntryUseCaseExecute;
}
