import {
    IIsRecordLockedParams,
    ILockingMechanismRecord,
    IPossiblyLockingMechanismRecord
} from "~/types";

export interface ILockingMechanismSetRecordsCb {
    (records: ILockingMechanismRecord[]): Promise<void>;
}

export interface ILockingMechanism<
    T extends IPossiblyLockingMechanismRecord = IPossiblyLockingMechanismRecord
> {
    records: ILockingMechanismRecord[];
    setRecords(
        folderId: string,
        type: string,
        records: T[],
        cb: ILockingMechanismSetRecordsCb
    ): Promise<void>;
    isRecordLocked(record: IIsRecordLockedParams): boolean;

    // lockEntry(params: ILockingMechanismLockEntryParams): Promise<ILockingMechanismLockEntryResult>;
    // unlockEntry(
    //     params: ILockingMechanismUnlockEntryParams
    // ): Promise<ILockingMechanismUnlockEntryResult>;
    // unlockEntryRequest(
    //     params: ILockingMechanismUnlockEntryRequestParams
    // ): Promise<ILockingMechanismUnlockEntryRequestResult>;
    // isEntryLocked(
    //     params: ILockingMechanismIsEntryLockedParams
    // ): Promise<ILockingMechanismIsEntryLockedResult>;
    // getLockRecord(
    //     params: ILockingMechanismGetLockRecordParams
    // ): Promise<ILockingMechanismGetLockRecordResult>;
    // listLockRecords(
    //     params: ILockingMechanismListLockRecordsParams
    // ): Promise<ILockingMechanismListLockRecordsResult>;

    // onRequestAccess(): Promise<void>;
    // acceptAccessRequest(): Promise<void>;
    // rejectAccessRequest(): Promise<void>;
}
