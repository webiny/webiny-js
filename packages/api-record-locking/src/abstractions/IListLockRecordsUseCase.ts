import { IListAllLockRecordsUseCaseExecuteParams } from "./IListAllLockRecordsUseCase";
import { IRecordLockingListAllLockRecordsResponse } from "~/types";

export type IListLockRecordsUseCaseExecuteParams = IListAllLockRecordsUseCaseExecuteParams;

export type IListLockRecordsUseCaseExecuteResponse = IRecordLockingListAllLockRecordsResponse;

export interface IListLockRecordsUseCaseExecute {
    (params: IListLockRecordsUseCaseExecuteParams): Promise<IListLockRecordsUseCaseExecuteResponse>;
}

export interface IListLockRecordsUseCase {
    execute: IListLockRecordsUseCaseExecute;
}
