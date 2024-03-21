import { IHeadlessCmsLockRecordEntryType } from "~/lockingMechanism/types";

export interface IUnlockEntryUseCaseExecuteParams {
    id: string;
    type: IHeadlessCmsLockRecordEntryType;
}

export interface IUnlockEntryUseCaseExecute {
    (params: IUnlockEntryUseCaseExecuteParams): Promise<void>;
}

export interface IUnlockEntryUseCase {
    execute: IUnlockEntryUseCaseExecute;
}
