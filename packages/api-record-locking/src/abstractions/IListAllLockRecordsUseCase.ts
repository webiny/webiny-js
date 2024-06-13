import {
    IRecordLockingListAllLockRecordsParams,
    IRecordLockingListAllLockRecordsResponse
} from "~/types";

export type IListAllLockRecordsUseCaseExecuteParams = IRecordLockingListAllLockRecordsParams;

export type IListAllLockRecordsUseCaseExecuteResponse = IRecordLockingListAllLockRecordsResponse;

export interface IListAllLockRecordsUseCaseExecute {
    (
        params: IListAllLockRecordsUseCaseExecuteParams
    ): Promise<IListAllLockRecordsUseCaseExecuteResponse>;
}

export interface IListAllLockRecordsUseCase {
    execute: IListAllLockRecordsUseCaseExecute;
}
