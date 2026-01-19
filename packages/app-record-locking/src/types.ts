import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import type { GenericRecord } from "@webiny/app/types.js";
import type { IRecordLockingUnlockEntryResult } from "~/domain/abstractions/IRecordLockingUnlockEntry.js";
import type { IRecordLockingUpdateEntryLockResult } from "~/domain/abstractions/IRecordLocking.js";
import { Identity } from "@webiny/app-admin/domain/Identity.js";

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

export interface IRecordLockingCmsEntryValuesAction {
    type: string;
    message: string;
    createdBy: Identity;
    createdOn: string;
}

export interface IRecordLockingCmsEntryValues {
    lockedBy: Identity;
    lockedOn: string;
    updatedOn: string;
    expiresOn: string;
    targetId: string;
    type: string;
    actions: IRecordLockingCmsEntryValuesAction;
}

export interface IPossiblyRecordLockingRecord extends CmsContentEntry<IRecordLockingCmsEntryValues> {
    $selectable?: boolean;
    $type?: "RECORD";
    $lockingType?: string;
    $locked?: IRecordLockingRecordLocked | null;
}

export interface IRecordLockingRecord extends IPossiblyRecordLockingRecord {
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
    updateEntryLock(params: IUpdateEntryLockParams): Promise<IRecordLockingUpdateEntryLockResult>;
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

export interface RecordLockingSecurityPermission extends Identity.Permission {
    canForceUnlock?: string;
}
