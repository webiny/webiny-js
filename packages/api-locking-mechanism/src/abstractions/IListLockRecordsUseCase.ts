import {
    ILockingMechanismListLockRecordsParams,
    ILockingMechanismListLockRecordsResponse
} from "~/types";

export type IListLockRecordsUseCaseExecuteParams = ILockingMechanismListLockRecordsParams;

export type IListLockRecordsUseCaseExecuteResponse = ILockingMechanismListLockRecordsResponse;

export interface IListLockRecordsUseCaseExecute {
    (params: IListLockRecordsUseCaseExecuteParams): Promise<IListLockRecordsUseCaseExecuteResponse>;
}

export interface IListLockRecordsUseCase {
    execute: IListLockRecordsUseCaseExecute;
}
