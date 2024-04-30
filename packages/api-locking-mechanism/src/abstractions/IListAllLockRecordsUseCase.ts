import {
    ILockingMechanismListAllLockRecordsParams,
    ILockingMechanismListAllLockRecordsResponse
} from "~/types";

export type IListAllLockRecordsUseCaseExecuteParams = ILockingMechanismListAllLockRecordsParams;

export type IListAllLockRecordsUseCaseExecuteResponse = ILockingMechanismListAllLockRecordsResponse;

export interface IListAllLockRecordsUseCaseExecute {
    (
        params: IListAllLockRecordsUseCaseExecuteParams
    ): Promise<IListAllLockRecordsUseCaseExecuteResponse>;
}

export interface IListAllLockRecordsUseCase {
    execute: IListAllLockRecordsUseCaseExecute;
}
