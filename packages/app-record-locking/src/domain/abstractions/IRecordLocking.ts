import {
    IIsRecordLockedParams,
    IUpdateEntryLockParams,
    IRecordLockingRecord,
    IPossiblyRecordLockingRecord,
    IRecordLockingError,
    IRecordLockingLockRecord,
    IUnlockEntryParams,
    IFetchLockRecordParams,
    IFetchLockRecordResult,
    IFetchLockedEntryLockRecordParams
} from "~/types";
import { IRecordLockingUnlockEntryResult } from "./IRecordLockingUnlockEntry";

export interface IRecordLockingUpdateEntryLockResult {
    data: IRecordLockingLockRecord | null;
    error: IRecordLockingError | null;
}

export interface IRecordLocking<
    T extends IPossiblyRecordLockingRecord = IPossiblyRecordLockingRecord
> {
    loading: boolean;
    records: IRecordLockingRecord[];
    setRecords(
        folderId: string,
        type: string,
        records: T[]
    ): Promise<IRecordLockingRecord[] | undefined>;
    isLockExpired(input: Date | string): boolean;
    isRecordLocked(record: IIsRecordLockedParams): boolean;
    getLockRecordEntry(id: string): IRecordLockingRecord | undefined;
    fetchLockRecord(params: IFetchLockRecordParams): Promise<IFetchLockRecordResult>;
    fetchLockedEntryLockRecord(
        params: IFetchLockedEntryLockRecordParams
    ): Promise<IRecordLockingLockRecord | null>;
    updateEntryLock(params: IUpdateEntryLockParams): Promise<IRecordLockingUpdateEntryLockResult>;
    removeEntryLock(params: IUnlockEntryParams): void;
    unlockEntry(
        params: IUnlockEntryParams,
        force?: boolean
    ): Promise<IRecordLockingUnlockEntryResult>;
    // lockEntry(params: IRecordLockingLockEntryParams): Promise<IRecordLockingLockEntryResult>;
    // unlockEntryRequest(
    //     params: IRecordLockingUnlockEntryRequestParams
    // ): Promise<IRecordLockingUnlockEntryRequestResult>;
    // isEntryLocked(
    //     params: IRecordLockingIsEntryLockedParams
    // ): Promise<IRecordLockingIsEntryLockedResult>;
    // getLockRecord(
    //     params: IRecordLockingGetLockRecordParams
    // ): Promise<IRecordLockingGetLockRecordResult>;
    // listLockRecords(
    //     params: IRecordLockingListLockRecordsParams
    // ): Promise<IRecordLockingListLockRecordsResult>;

    // onRequestAccess(): Promise<void>;
    // acceptAccessRequest(): Promise<void>;
    // rejectAccessRequest(): Promise<void>;
}
