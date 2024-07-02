import { IRecordLockingGetLockRecordParams, IRecordLockingLockRecord } from "~/types";

export type IGetLockRecordUseCaseExecuteParams = IRecordLockingGetLockRecordParams;

export interface IGetLockRecordUseCaseExecute {
    (params: IGetLockRecordUseCaseExecuteParams): Promise<IRecordLockingLockRecord | null>;
}

export interface IGetLockRecordUseCase {
    execute: IGetLockRecordUseCaseExecute;
}
