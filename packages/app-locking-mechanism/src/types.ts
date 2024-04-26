import { EntryTableItem } from "@webiny/app-headless-cms/types";
import { GenericRecord } from "@webiny/app/types";
import { ILockingMechanismUnlockEntryResult } from "~/domain/abstractions/ILockingMechanismUnlockEntry";

// export interface ILockingMechanismContextRecord {
//     id: string;
//     type: string;
//     locked?: boolean;
// }

export interface ILockingMechanismIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface ILockingMechanismRecordLocked {
    lockedBy: ILockingMechanismIdentity;
    lockedOn: string;
    expiresOn: string;
    actions: ILockingMechanismLockRecordAction[];
}

export interface IPossiblyLockingMechanismRecord extends EntryTableItem {
    $lockingType?: string;
    entryId: string;
    $locked?: ILockingMechanismRecordLocked | null;
}

export interface ILockingMechanismRecord extends IPossiblyLockingMechanismRecord {
    entryId: string;
    $lockingType: string;
}

export type IIsRecordLockedParams = Pick<ILockingMechanismRecord, "id" | "$lockingType">;

export type IUpdateEntryLockParams = Pick<ILockingMechanismRecord, "id" | "$lockingType">;

export type IUnlockEntryParams = Pick<ILockingMechanismRecord, "id" | "$lockingType">;

export type IFetchLockRecordParams = Pick<ILockingMechanismRecord, "id" | "$lockingType">;

export type IFetchLockedEntryLockRecordParams = Pick<
    ILockingMechanismRecord,
    "id" | "$lockingType"
>;

export interface IFetchLockRecordResult {
    data: ILockingMechanismLockRecord | null;
    error: ILockingMechanismError | null;
}

export interface ILockingMechanismContext<
    T extends IPossiblyLockingMechanismRecord = IPossiblyLockingMechanismRecord
> {
    readonly loading: boolean;
    readonly records: IPossiblyLockingMechanismRecord[];
    readonly error?: ILockingMechanismError | null;
    setRecords(folderId: string, type: string, records: T[]): Promise<void>;
    updateEntryLock(params: IUpdateEntryLockParams): Promise<void>;
    isRecordLocked(params?: IIsRecordLockedParams): boolean;
    getLockRecordEntry(id: string): ILockingMechanismRecord | undefined;
    fetchLockRecord(params: IFetchLockRecordParams): Promise<IFetchLockRecordResult>;
    fetchLockedEntryLockRecord(
        params: IFetchLockedEntryLockRecordParams
    ): Promise<ILockingMechanismLockRecord | null>;
    unlockEntry(params: IUnlockEntryParams): Promise<ILockingMechanismUnlockEntryResult>;
    unlockEntryForce(params: IUnlockEntryParams): Promise<ILockingMechanismUnlockEntryResult>;
    isLockExpired(input: Date | string): boolean;
}

export interface ILockingMechanismLockRecordAction {
    type: string;
    message: string;
    createdBy: ILockingMechanismIdentity;
    createdOn: string;
}

export interface ILockingMechanismLockRecord {
    id: string;
    lockedOn: string;
    expiresOn: string;
    lockedBy: ILockingMechanismIdentity;
    targetId: string;
    type: string;
    actions: ILockingMechanismLockRecordAction[];
}

export interface ILockingMechanismMeta {
    totalCount: number;
    cursor: string | null;
    hasMoreItems: boolean;
}

export interface ILockingMechanismError<T = GenericRecord> {
    message: string;
    code: string;
    data?: T;
}
