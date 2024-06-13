import { IRecordLockingError, IRecordLockingLockRecord, IRecordLockingMeta } from "~/types";

export interface IRecordLockingListLockRecordsParamsWhere {
    id_in?: string[];
    type?: string;
}

export interface IRecordLockingListLockRecordsParams {
    where?: IRecordLockingListLockRecordsParamsWhere;
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface IRecordLockingListLockRecordsResult {
    data: IRecordLockingLockRecord[] | null;
    error: IRecordLockingError | null;
    meta: IRecordLockingMeta | null;
}

export interface IRecordLockingListLockRecords {
    execute(
        params: IRecordLockingListLockRecordsParams
    ): Promise<IRecordLockingListLockRecordsResult>;
}
