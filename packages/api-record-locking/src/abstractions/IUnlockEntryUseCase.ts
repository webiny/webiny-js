import { IRecordLockingLockRecord, IRecordLockingLockRecordEntryType } from "~/types";

export interface IUnlockEntryUseCaseExecuteParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
    force?: boolean;
}

export interface IUnlockEntryUseCaseExecute {
    (params: IUnlockEntryUseCaseExecuteParams): Promise<IRecordLockingLockRecord>;
}

export interface IUnlockEntryUseCase {
    execute: IUnlockEntryUseCaseExecute;
}
