import { IRecordLockingError, IRecordLockingLockRecord } from "~/types";

export interface IRecordLockingGetLockRecordExecuteParams {
    id: string;
    type: string;
}

export interface IRecordLockingGetLockRecordExecuteResult {
    data: IRecordLockingLockRecord | null;
    error: IRecordLockingError | null;
}

export interface IRecordLockingGetLockRecord {
    execute(
        params: IRecordLockingGetLockRecordExecuteParams
    ): Promise<IRecordLockingGetLockRecordExecuteResult>;
}
