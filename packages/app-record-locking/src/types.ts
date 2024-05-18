import { EntryTableItem } from "@webiny/app-headless-cms/types";
import { GenericRecord } from "@webiny/app/types";
import { IRecordLockingUnlockEntryResult } from "~/domain/abstractions/IRecordLockingUnlockEntry";

export interface IRecordLockingIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface IRecordLockingRecordLocked {
    lockedBy: IRecordLockingIdentity;
    lockedOn: string;
    expiresOn: string;
    actions: IRecordLockingLockRecordAction[];
}

export interface IPossiblyRecordLockingRecord extends EntryTableItem {
    $lockingType?: string;
    entryId: string;
    $locked?: IRecordLockingRecordLocked | null;
}

export interface IRecordLockingRecord extends IPossiblyRecordLockingRecord {
    entryId: string;
    $lockingType: string;
}

export type IIsRecordLockedParams = Pick<IRecordLockingRecord, "id" | "$lockingType">;

export type IUpdateEntryLockParams = Pick<IRecordLockingRecord, "id" | "$lockingType">;

export type IUnlockEntryParams = Pick<IRecordLockingRecord, "id" | "$lockingType">;

export type IFetchLockRecordParams = Pick<IRecordLockingRecord, "id" | "$lockingType">;

export type IFetchLockedEntryLockRecordParams = Pick<IRecordLockingRecord, "id" | "$lockingType">;

export interface IFetchLockRecordResult {
    data: IRecordLockingLockRecord | null;
    error: IRecordLockingError | null;
}

export interface IRecordLockingContext<
    T extends IPossiblyRecordLockingRecord = IPossiblyRecordLockingRecord
> {
    readonly loading: boolean;
    readonly records: IPossiblyRecordLockingRecord[];
    readonly error?: IRecordLockingError | null;
    setRecords(folderId: string, type: string, records: T[]): Promise<void>;
    updateEntryLock(params: IUpdateEntryLockParams): Promise<void>;
    isRecordLocked(params?: IIsRecordLockedParams): boolean;
    getLockRecordEntry(id: string): IRecordLockingRecord | undefined;
    fetchLockRecord(params: IFetchLockRecordParams): Promise<IFetchLockRecordResult>;
    fetchLockedEntryLockRecord(
        params: IFetchLockedEntryLockRecordParams
    ): Promise<IRecordLockingLockRecord | null>;
    unlockEntry(params: IUnlockEntryParams): Promise<IRecordLockingUnlockEntryResult>;
    removeEntryLock(params: IUnlockEntryParams): void;
    unlockEntryForce(params: IUnlockEntryParams): Promise<IRecordLockingUnlockEntryResult>;
    isLockExpired(input: Date | string): boolean;
}

export interface IRecordLockingLockRecordAction {
    type: string;
    message: string;
    createdBy: IRecordLockingIdentity;
    createdOn: string;
}

export interface IRecordLockingLockRecord {
    id: string;
    lockedOn: string;
    expiresOn: string;
    lockedBy: IRecordLockingIdentity;
    targetId: string;
    type: string;
    actions: IRecordLockingLockRecordAction[];
}

export interface IRecordLockingMeta {
    totalCount: number;
    cursor: string | null;
    hasMoreItems: boolean;
}

export interface IRecordLockingError<T = GenericRecord> {
    message: string;
    code: string;
    data?: T;
}
