import { ILockingMechanismGetLockRecordParams, ILockingMechanismLockRecord } from "~/types";

export type IGetLockRecordUseCaseExecuteParams = ILockingMechanismGetLockRecordParams;

export interface IGetLockRecordUseCaseExecute {
    (params: IGetLockRecordUseCaseExecuteParams): Promise<ILockingMechanismLockRecord | null>;
}

export interface IGetLockRecordUseCase {
    execute: IGetLockRecordUseCaseExecute;
}
