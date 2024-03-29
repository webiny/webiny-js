import { ILockingMechanismLockRecord } from "~/types";

export type IGetLockRecordUseCaseExecuteParams = string;

export interface IGetLockRecordUseCaseExecute {
    (params: IGetLockRecordUseCaseExecuteParams): Promise<ILockingMechanismLockRecord | null>;
}

export interface IGetLockRecordUseCase {
    execute: IGetLockRecordUseCaseExecute;
}
