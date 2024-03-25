import { IHeadlessCmsLockRecord, IHeadlessCmsLockRecordEntryType } from "~/lockingMechanism/types";

export interface IUnlockEntryRequestUseCaseExecuteParams {
    id: string;
    type: IHeadlessCmsLockRecordEntryType;
}

export interface IUnlockEntryRequestUseCaseExecute {
    (params: IUnlockEntryRequestUseCaseExecuteParams): Promise<IHeadlessCmsLockRecord>;
}

export interface IUnlockEntryRequestUseCase {
    execute: IUnlockEntryRequestUseCaseExecute;
}
