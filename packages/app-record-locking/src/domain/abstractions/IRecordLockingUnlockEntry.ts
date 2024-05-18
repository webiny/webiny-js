import { IRecordLockingError, IRecordLockingLockRecord } from "~/types";

export interface IRecordLockingUnlockEntryParams {
    id: string;
    type: string;
    force?: boolean;
}

export interface IRecordLockingUnlockEntryResult {
    data: IRecordLockingLockRecord | null;
    error: IRecordLockingError | null;
}

export interface IRecordLockingUnlockEntry {
    execute(params: IRecordLockingUnlockEntryParams): Promise<IRecordLockingUnlockEntryResult>;
}
