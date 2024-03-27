import {
    CmsContext,
    CmsError,
    CmsEntry,
    CmsIdentity,
    CmsModelManager
} from "@webiny/api-headless-cms/types";
import { Topic } from "@webiny/pubsub/types";

export { CmsIdentity, CmsError, CmsEntry };

export type ILockingMechanismModelManager = CmsModelManager<ILockingMechanismLockRecordValues>;

export interface ILockingMechanismLockRecordValues {
    targetId: string;
    type: ILockingMechanismLockRecordEntryType;
    actions?: ILockingMechanismLockRecordAction[];
}
export enum ILockingMechanismLockRecordActionType {
    requested = "requested",
    approved = "approved",
    denied = "denied"
}

export interface ILockingMechanismLockRecordRequestedAction {
    type: ILockingMechanismLockRecordActionType.requested;
    message?: string;
    createdOn: Date;
    createdBy: CmsIdentity;
}

export interface ILockingMechanismLockRecordApprovedAction {
    type: ILockingMechanismLockRecordActionType.approved;
    message?: string;
    createdOn: Date;
    createdBy: CmsIdentity;
}

export interface ILockingMechanismLockRecordDeniedAction {
    type: ILockingMechanismLockRecordActionType.denied;
    message?: string;
    createdOn: Date;
    createdBy: CmsIdentity;
}

export type ILockingMechanismLockRecordAction =
    | ILockingMechanismLockRecordRequestedAction
    | ILockingMechanismLockRecordApprovedAction
    | ILockingMechanismLockRecordDeniedAction;

export interface ILockingMechanismLockRecordObject {
    id: string;
    targetId: string;
    type: ILockingMechanismLockRecordEntryType;
    lockedBy: CmsIdentity;
    lockedOn: Date;
    actions?: ILockingMechanismLockRecordAction[];
}

export interface ILockingMechanismLockRecord extends ILockingMechanismLockRecordObject {
    toObject(): ILockingMechanismLockRecordObject;
    addAction(action: ILockingMechanismLockRecordAction): void;
    getUnlockRequested(): ILockingMechanismLockRecordRequestedAction | undefined;
    getUnlockApproved(): ILockingMechanismLockRecordApprovedAction | undefined;
    getUnlockDenied(): ILockingMechanismLockRecordDeniedAction | undefined;
}

/**
 * Do not use any special chars other than #, as we use this to create lock record IDs.
 */
export type ILockingMechanismLockRecordEntryType = string;

export interface ILockingMechanismIsLockedParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface ILockingMechanismLockEntryParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface ILockingMechanismUnlockEntryParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface ILockingMechanismUnlockEntryRequestParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface OnEntryBeforeLockTopicParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface OnEntryAfterLockTopicParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
    record: ILockingMechanismLockRecord;
}

export interface OnEntryLockErrorTopicParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
    error: CmsError;
}

export interface OnEntryBeforeUnlockTopicParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
    getIdentity(): CmsIdentity;
}

export interface OnEntryAfterUnlockTopicParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
    record: ILockingMechanismLockRecord;
}

export interface OnEntryUnlockErrorTopicParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
    error: CmsError;
}

export interface OnEntryBeforeUnlockRequestTopicParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface OnEntryAfterUnlockRequestTopicParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
    record: ILockingMechanismLockRecord;
}

export interface OnEntryUnlockRequestErrorTopicParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
    error: CmsError;
}

export interface ILockingMechanism {
    onEntryBeforeLock: Topic<OnEntryBeforeLockTopicParams>;
    onEntryAfterLock: Topic<OnEntryAfterLockTopicParams>;
    onEntryLockError: Topic<OnEntryLockErrorTopicParams>;
    onEntryBeforeUnlock: Topic<OnEntryBeforeUnlockTopicParams>;
    onEntryAfterUnlock: Topic<OnEntryAfterUnlockTopicParams>;
    onEntryUnlockError: Topic<OnEntryUnlockErrorTopicParams>;
    onEntryBeforeUnlockRequest: Topic<OnEntryBeforeUnlockRequestTopicParams>;
    onEntryAfterUnlockRequest: Topic<OnEntryAfterUnlockRequestTopicParams>;
    onEntryUnlockRequestError: Topic<OnEntryUnlockRequestErrorTopicParams>;
    getLockRecord(id: string): Promise<ILockingMechanismLockRecord | null>;
    isEntryLocked(params: ILockingMechanismIsLockedParams): Promise<boolean>;
    lockEntry(params: ILockingMechanismLockEntryParams): Promise<ILockingMechanismLockRecord>;
    unlockEntry(params: ILockingMechanismUnlockEntryParams): Promise<ILockingMechanismLockRecord>;
    unlockEntryRequest(
        params: ILockingMechanismUnlockEntryRequestParams
    ): Promise<ILockingMechanismLockRecord>;
}

export interface Context extends CmsContext {
    lockingMechanism: ILockingMechanism;
}
