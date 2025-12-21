import type {
    CmsEntryListParams,
    CmsEntryMeta,
    CmsIdentity
} from "@webiny/api-headless-cms/types/index.js";
import { CmsEntry, CmsError } from "@webiny/api-headless-cms/types/index.js";

export type { CmsError, CmsEntry };

export type IRecordLockingIdentity = CmsIdentity;

export type IRecordLockingMeta = CmsEntryMeta;

export enum RecordLockingLockRecordActionType {
    requested = "requested",
    approved = "approved",
    denied = "denied"
}

export interface IRecordLockingLockRecordRequestedAction {
    type: RecordLockingLockRecordActionType.requested;
    message?: string;
    createdOn: Date;
    createdBy: IRecordLockingIdentity;
}

export interface IRecordLockingLockRecordApprovedAction {
    type: RecordLockingLockRecordActionType.approved;
    message?: string;
    createdOn: Date;
    createdBy: IRecordLockingIdentity;
}

export interface IRecordLockingLockRecordDeniedAction {
    type: RecordLockingLockRecordActionType.denied;
    message?: string;
    createdOn: Date;
    createdBy: IRecordLockingIdentity;
}

export type IRecordLockingLockRecordAction =
    | IRecordLockingLockRecordRequestedAction
    | IRecordLockingLockRecordApprovedAction
    | IRecordLockingLockRecordDeniedAction;

export interface IRecordLockingLockRecordObject {
    id: string;
    targetId: string;
    type: IRecordLockingLockRecordEntryType;
    lockedBy: IRecordLockingIdentity;
    lockedOn: Date;
    updatedOn: Date;
    expiresOn: Date;
    actions?: IRecordLockingLockRecordAction[];
}

export interface IRecordLockingLockRecord extends IRecordLockingLockRecordObject {
    toObject(): IRecordLockingLockRecordObject;
    addAction(action: IRecordLockingLockRecordAction): void;
    getUnlockRequested(): IRecordLockingLockRecordRequestedAction | undefined;
    getUnlockApproved(): IRecordLockingLockRecordApprovedAction | undefined;
    getUnlockDenied(): IRecordLockingLockRecordDeniedAction | undefined;
    isExpired(): boolean;
}

/**
 * Do not use any special chars other than #, as we use this to create lock record IDs.
 */
export type IRecordLockingLockRecordEntryType = string;

export type IRecordLockingListAllLockRecordsParams = Pick<
    CmsEntryListParams,
    "where" | "limit" | "sort" | "after"
>;

export type IRecordLockingListLockRecordsParams = IRecordLockingListAllLockRecordsParams;
