import {
    IIsRecordLockedParams,
    IUpdateEntryLockParams,
    ILockingMechanismRecord,
    IPossiblyLockingMechanismRecord,
    ILockingMechanismError,
    ILockingMechanismLockRecord,
    IUnlockEntryParams,
    IFetchLockRecordParams,
    IFetchLockRecordResult,
    IFetchLockedEntryLockRecordParams
} from "~/types";
import { ILockingMechanismUnlockEntryResult } from "./ILockingMechanismUnlockEntry";

export interface ILockingMechanismUpdateEntryLockResult {
    data: ILockingMechanismLockRecord | null;
    error: ILockingMechanismError | null;
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
    isLockExpired(input: Date | string): boolean;
    isRecordLocked(record: IIsRecordLockedParams): boolean;
    getLockRecordEntry(id: string): ILockingMechanismRecord | undefined;
    fetchLockRecord(params: IFetchLockRecordParams): Promise<IFetchLockRecordResult>;
    fetchLockedEntryLockRecord(
        params: IFetchLockedEntryLockRecordParams
    ): Promise<ILockingMechanismLockRecord | null>;
    updateEntryLock(
        params: IUpdateEntryLockParams
    ): Promise<ILockingMechanismUpdateEntryLockResult>;
    removeEntryLock(params: IUnlockEntryParams): void;
    unlockEntry(
        params: IUnlockEntryParams,
        force?: boolean
    ): Promise<ILockingMechanismUnlockEntryResult>;
    // lockEntry(params: ILockingMechanismLockEntryParams): Promise<ILockingMechanismLockEntryResult>;
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
