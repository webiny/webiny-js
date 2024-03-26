import { IHeadlessCmsLockRecord } from "~/lockingMechanism/types";

export interface IGetLockRecordUseCaseExecuteParamsObject {
    id: string;
}
export type IGetLockRecordUseCaseExecuteParams = IGetLockRecordUseCaseExecuteParamsObject | string;

export interface IGetLockRecordUseCaseExecute {
    (params: IGetLockRecordUseCaseExecuteParams): Promise<IHeadlessCmsLockRecord | null>;
}

export interface IGetLockRecordUseCase {
    execute: IGetLockRecordUseCaseExecute;
}
