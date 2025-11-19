import type { CmsIdentity } from "@webiny/api-headless-cms/types";

/**
 * Do not use any special chars other than #, as we use this to create lock record IDs.
 */
export type LockRecordEntryType = string;

export enum RecordLockingLockRecordActionType {
    requested = "requested",
    approved = "approved",
    denied = "denied"
}

export interface LockRecordRequestedAction {
    type: RecordLockingLockRecordActionType.requested;
    message?: string;
    createdOn: Date;
    createdBy: CmsIdentity;
}

export interface LockRecordApprovedAction {
    type: RecordLockingLockRecordActionType.approved;
    message?: string;
    createdOn: Date;
    createdBy: CmsIdentity;
}

export interface LockRecordDeniedAction {
    type: RecordLockingLockRecordActionType.denied;
    message?: string;
    createdOn: Date;
    createdBy: CmsIdentity;
}

export type LockRecordAction =
    | LockRecordRequestedAction
    | LockRecordApprovedAction
    | LockRecordDeniedAction;

export interface LockRecordValues {
    targetId: string;
    type: LockRecordEntryType;
    actions?: LockRecordAction[];
}

export interface LockRecordObject {
    id: string;
    targetId: string;
    type: LockRecordEntryType;
    lockedBy: CmsIdentity;
    lockedOn: Date;
    updatedOn: Date;
    expiresOn: Date;
    actions?: LockRecordAction[];
}
