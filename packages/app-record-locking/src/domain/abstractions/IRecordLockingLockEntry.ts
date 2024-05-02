import { IRecordLockingError, IRecordLockingLockRecord } from "~/types";

export interface IRecordLockingLockEntryParams {
    id: string;
    type: string;
}

export interface IRecordLockingLockEntryResult {
    data: IRecordLockingLockRecord | null;
    error: IRecordLockingError | null;
}

export interface IRecordLockingLockEntry {
    execute(params: IRecordLockingLockEntryParams): Promise<IRecordLockingLockEntryResult>;
}
