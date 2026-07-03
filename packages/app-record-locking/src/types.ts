import type { GenericRecord } from "@webiny/app/types.js";
import { Identity } from "@webiny/app-admin/domain/Identity.js";

export interface IRecordLockingIdentity {
    id: string;
    displayName: string;
    type: string;
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
    updatedOn: string;
    expiresOn: string;
    lockedBy: IRecordLockingIdentity;
    targetId: string;
    type: string;
    actions: IRecordLockingLockRecordAction[];
}

export interface IRecordLockingError<T = GenericRecord> {
    message: string;
    code: string;
    data?: T;
}

export interface RecordLockingSecurityPermission extends Identity.Permission {
    canForceUnlock?: boolean;
}
