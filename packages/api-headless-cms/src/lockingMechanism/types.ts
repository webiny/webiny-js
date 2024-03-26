import { CmsError, CmsIdentity, CmsModelManager } from "~/types";
import { Topic } from "@webiny/pubsub/types";

export type ICmsModelLockRecordManager = CmsModelManager<IHeadlessCmsLockRecordValues>;

export interface IHeadlessCmsLockRecordValues {
    targetId: string;
    type: IHeadlessCmsLockRecordEntryType;
    actions?: IHeadlessCmsLockRecordAction[];
}
export enum IHeadlessCmsLockRecordActionType {
    requested = "requested",
    approved = "approved",
    denied = "denied"
}

export interface IHeadlessCmsLockRecordRequestedAction {
    type: IHeadlessCmsLockRecordActionType.requested;
    message?: string;
    createdOn: Date;
    createdBy: CmsIdentity;
}

export interface IHeadlessCmsLockRecordApprovedAction {
    type: IHeadlessCmsLockRecordActionType.approved;
    message?: string;
    createdOn: Date;
    createdBy: CmsIdentity;
}

export interface IHeadlessCmsLockRecordDeniedAction {
    type: IHeadlessCmsLockRecordActionType.denied;
    message?: string;
    createdOn: Date;
    createdBy: CmsIdentity;
}

export type IHeadlessCmsLockRecordAction =
    | IHeadlessCmsLockRecordRequestedAction
    | IHeadlessCmsLockRecordApprovedAction
    | IHeadlessCmsLockRecordDeniedAction;

export interface IHeadlessCmsLockRecordObject {
    id: string;
    targetId: string;
    type: IHeadlessCmsLockRecordEntryType;
    lockedBy: CmsIdentity;
    lockedOn: Date;
    actions?: IHeadlessCmsLockRecordAction[];
}

export interface IHeadlessCmsLockRecord extends IHeadlessCmsLockRecordObject {
    toObject(): IHeadlessCmsLockRecordObject;
    addAction(action: IHeadlessCmsLockRecordAction): void;
    getUnlockRequested(): IHeadlessCmsLockRecordRequestedAction | undefined;
    getUnlockApproved(): IHeadlessCmsLockRecordApprovedAction | undefined;
    getUnlockDenied(): IHeadlessCmsLockRecordDeniedAction | undefined;
}

/**
 * Do not use any special chars other than #, as we use this to create lock record IDs.
 */
export type IHeadlessCmsLockRecordEntryType = string;

export interface IHeadlessCmsLockingMechanismIsLockedParams {
    id: string;
    type: IHeadlessCmsLockRecordEntryType;
}

export interface IHeadlessCmsLockingMechanismLockEntryParams {
    id: string;
    type: IHeadlessCmsLockRecordEntryType;
}

export interface IHeadlessCmsLockingMechanismUnlockEntryParams {
    id: string;
    type: IHeadlessCmsLockRecordEntryType;
}

export interface IHeadlessCmsLockingMechanismUnlockEntryRequestParams {
    id: string;
    type: IHeadlessCmsLockRecordEntryType;
}

export interface OnEntryBeforeLockTopicParams {
    id: string;
    type: IHeadlessCmsLockRecordEntryType;
}

export interface OnEntryAfterLockTopicParams {
    id: string;
    type: IHeadlessCmsLockRecordEntryType;
    record: IHeadlessCmsLockRecord;
}

export interface OnEntryLockErrorTopicParams {
    id: string;
    type: IHeadlessCmsLockRecordEntryType;
    error: CmsError;
}

export interface OnEntryBeforeUnlockTopicParams {}

export interface OnEntryAfterUnlockTopicParams {}

export interface OnEntryUnlockErrorTopicParams {}

export interface OnEntryBeforeUnlockRequestTopicParams {}

export interface OnEntryAfterUnlockRequestTopicParams {}

export interface OnEntryUnlockRequestErrorTopicParams {}

export interface IHeadlessCmsLockingMechanism {
    onEntryBeforeLock: Topic<OnEntryBeforeLockTopicParams>;
    onEntryAfterLock: Topic<OnEntryAfterLockTopicParams>;
    onEntryLockError: Topic<OnEntryLockErrorTopicParams>;
    onEntryBeforeUnlock: Topic<OnEntryBeforeUnlockTopicParams>;
    onEntryAfterUnlock: Topic<OnEntryAfterUnlockTopicParams>;
    onEntryUnlockError: Topic<OnEntryUnlockErrorTopicParams>;
    onEntryBeforeUnlockRequest: Topic<OnEntryBeforeUnlockRequestTopicParams>;
    onEntryAfterUnlockRequest: Topic<OnEntryAfterUnlockRequestTopicParams>;
    onEntryUnlockRequestError: Topic<OnEntryUnlockRequestErrorTopicParams>;
    getLockRecord(id: string): Promise<IHeadlessCmsLockRecord | null>;
    isEntryLocked(params: IHeadlessCmsLockingMechanismIsLockedParams): Promise<boolean>;
    lockEntry(params: IHeadlessCmsLockingMechanismLockEntryParams): Promise<IHeadlessCmsLockRecord>;
    unlockEntry(params: IHeadlessCmsLockingMechanismUnlockEntryParams): Promise<void>;
    unlockEntryRequest(
        params: IHeadlessCmsLockingMechanismUnlockEntryRequestParams
    ): Promise<IHeadlessCmsLockRecord>;
}
