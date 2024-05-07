import { IRecordLockingError, IRecordLockingLockRecord } from "~/types";

export interface IRecordLockingGetLockedEntryLockRecordExecuteParams {
    id: string;
    type: string;
}

export interface IRecordLockingGetLockedEntryLockRecordExecuteResult {
    data: IRecordLockingLockRecord | null;
    error: IRecordLockingError | null;
}

export interface IRecordLockingGetLockedEntryLockRecord {
    execute(
        params: IRecordLockingGetLockedEntryLockRecordExecuteParams
    ): Promise<IRecordLockingGetLockedEntryLockRecordExecuteResult>;
}
