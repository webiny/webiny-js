import { EntryTableItem } from "@webiny/app-headless-cms/types";
import { GenericRecord } from "@webiny/app/types";

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
    actions: ILockingMechanismLockRecordAction[];
}

export interface IPossiblyLockingMechanismRecord extends EntryTableItem {
    $lockingType?: string;
    entryId?: string;
    $locked?: ILockingMechanismRecordLocked | null;
}

export interface ILockingMechanismRecord extends IPossiblyLockingMechanismRecord {
    entryId: string;
    $lockingType: string;
}

export type IIsRecordLockedParams = Pick<ILockingMechanismRecord, "id">;

export interface ILockingMechanismContextSetRecordsCb {
    (records: ILockingMechanismRecord[]): Promise<void>;
}
export interface ILockingMechanismContext<
    T extends IPossiblyLockingMechanismRecord = IPossiblyLockingMechanismRecord
> {
    records: ILockingMechanismRecord[];
    setRecords(
        folderId: string,
        type: string,
        records: T[],
        cb: ILockingMechanismContextSetRecordsCb
    ): void;
    isRecordLocked(params: IIsRecordLockedParams): boolean;
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
