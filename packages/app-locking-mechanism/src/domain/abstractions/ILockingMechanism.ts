import {
    IIsRecordLockedParams,
    ILockingMechanismRecord,
    IPossiblyLockingMechanismRecord
} from "~/types";

export interface ILockingMechanismSetRecordsCb {
    (records: ILockingMechanismRecord[]): void;
}

export interface ILockingMechanism<
    T extends IPossiblyLockingMechanismRecord = IPossiblyLockingMechanismRecord
> {
    loading: boolean;
    records: ILockingMechanismRecord[];
    setRecords(
        folderId: string,
        type: string,
        records: T[]
    ): Promise<ILockingMechanismRecord[] | undefined>;
    isRecordLocked(record: IIsRecordLockedParams): boolean;
    getLockRecordEntry(id: string): ILockingMechanismRecord | undefined;

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
