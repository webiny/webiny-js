import { ILockingMechanismLockRecord } from "~/types";

export interface IGetLockRecordUseCaseExecuteParamsObject {
    id: string;
}
export type IGetLockRecordUseCaseExecuteParams = IGetLockRecordUseCaseExecuteParamsObject | string;

export interface IGetLockRecordUseCaseExecute {
    (params: IGetLockRecordUseCaseExecuteParams): Promise<ILockingMechanismLockRecord | null>;
}

export interface IGetLockRecordUseCase {
    execute: IGetLockRecordUseCaseExecute;
}
