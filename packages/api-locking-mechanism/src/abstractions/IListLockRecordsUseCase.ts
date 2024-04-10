import { IListAllLockRecordsUseCaseExecuteParams } from "./IListAllLockRecordsUseCase";
import { ILockingMechanismListAllLockRecordsResponse } from "~/types";

export type IListLockRecordsUseCaseExecuteParams = IListAllLockRecordsUseCaseExecuteParams;

export type IListLockRecordsUseCaseExecuteResponse = ILockingMechanismListAllLockRecordsResponse;

export interface IListLockRecordsUseCaseExecute {
    (params: IListLockRecordsUseCaseExecuteParams): Promise<IListLockRecordsUseCaseExecuteResponse>;
}

export interface IListLockRecordsUseCase {
    execute: IListLockRecordsUseCaseExecute;
}
