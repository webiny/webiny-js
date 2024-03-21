import { IHeadlessCmsLockRecord, IHeadlessCmsLockRecordEntryType } from "~/lockingMechanism/types";

export interface ILockEntryUseCaseExecuteParams {
    id: string;
    type: IHeadlessCmsLockRecordEntryType;
}

export interface ILockEntryUseCaseExecute {
    (params: ILockEntryUseCaseExecuteParams): Promise<IHeadlessCmsLockRecord>;
}

export interface ILockEntryUseCase {
    execute: ILockEntryUseCaseExecute;
}
