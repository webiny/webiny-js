import { IRecordLockingError, IRecordLockingLockRecord } from "~/types";

export interface IRecordLockingUnlockEntryRequestParams {
    id: string;
    type: string;
}

export interface IRecordLockingUnlockEntryRequestResult {
    data: IRecordLockingLockRecord | null;
    error: IRecordLockingError | null;
}

export interface IRecordLockingUnlockEntryRequest {
    execute(
        params: IRecordLockingUnlockEntryRequestParams
    ): Promise<IRecordLockingUnlockEntryRequestResult>;
}
