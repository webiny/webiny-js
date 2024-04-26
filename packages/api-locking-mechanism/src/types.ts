import {
    CmsContext,
    CmsEntry,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsError,
    CmsIdentity,
    CmsModel,
    CmsModelManager
} from "@webiny/api-headless-cms/types";
import { Topic } from "@webiny/pubsub/types";
import {
    Context as IWebsocketsContext,
    IWebsocketsContextObject
} from "@webiny/api-websockets/types";

export { CmsError, CmsEntry };

export type ILockingMechanismIdentity = CmsIdentity;

export type ILockingMechanismModelManager = CmsModelManager<ILockingMechanismLockRecordValues>;

export type ILockingMechanismMeta = CmsEntryMeta;

export interface IHasFullAccessCallable {
    (): Promise<boolean>;
}

export interface IGetWebsocketsContextCallable {
    (): IWebsocketsContextObject;
}

export interface IGetIdentity {
    (): ILockingMechanismIdentity;
}

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
    createdBy: ILockingMechanismIdentity;
}

export interface ILockingMechanismLockRecordApprovedAction {
    type: ILockingMechanismLockRecordActionType.approved;
    message?: string;
    createdOn: Date;
    createdBy: ILockingMechanismIdentity;
}

export interface ILockingMechanismLockRecordDeniedAction {
    type: ILockingMechanismLockRecordActionType.denied;
    message?: string;
    createdOn: Date;
    createdBy: ILockingMechanismIdentity;
}

export type ILockingMechanismLockRecordAction =
    | ILockingMechanismLockRecordRequestedAction
    | ILockingMechanismLockRecordApprovedAction
    | ILockingMechanismLockRecordDeniedAction;

export interface ILockingMechanismLockRecordObject {
    id: string;
    targetId: string;
    type: ILockingMechanismLockRecordEntryType;
    lockedBy: ILockingMechanismIdentity;
    lockedOn: Date;
    updatedOn: Date;
    expiresOn: Date;
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

export type ILockingMechanismListAllLockRecordsParams = Pick<
    CmsEntryListParams,
    "where" | "limit" | "sort" | "after"
>;

export type ILockingMechanismListLockRecordsParams = ILockingMechanismListAllLockRecordsParams;

export interface ILockingMechanismListAllLockRecordsResponse {
    items: ILockingMechanismLockRecord[];
    meta: ILockingMechanismMeta;
}

export type ILockingMechanismListLockRecordsResponse = ILockingMechanismListAllLockRecordsResponse;

export interface ILockingMechanismGetLockRecordParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface ILockingMechanismIsLockedParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface ILockingMechanismGetLockedEntryLockRecordParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface ILockingMechanismLockEntryParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface ILockingMechanismUpdateEntryLockParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface ILockingMechanismUnlockEntryParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
    force?: boolean;
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
    getIdentity: IGetIdentity;
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
    getModel(): Promise<CmsModel>;
    listAllLockRecords(
        params?: ILockingMechanismListAllLockRecordsParams
    ): Promise<ILockingMechanismListAllLockRecordsResponse>;
    /**
     * Same call as listAllLockRecords, except this one will filter out records with expired lock.
     */
    listLockRecords(
        params?: ILockingMechanismListLockRecordsParams
    ): Promise<ILockingMechanismListLockRecordsResponse>;
    getLockRecord(
        params: ILockingMechanismGetLockRecordParams
    ): Promise<ILockingMechanismLockRecord | null>;
    isEntryLocked(params: ILockingMechanismIsLockedParams): Promise<boolean>;
    getLockedEntryLockRecord(
        params: ILockingMechanismGetLockedEntryLockRecordParams
    ): Promise<ILockingMechanismLockRecord | null>;
    lockEntry(params: ILockingMechanismLockEntryParams): Promise<ILockingMechanismLockRecord>;
    updateEntryLock(
        params: ILockingMechanismUpdateEntryLockParams
    ): Promise<ILockingMechanismLockRecord>;
    unlockEntry(params: ILockingMechanismUnlockEntryParams): Promise<ILockingMechanismLockRecord>;
    unlockEntryRequest(
        params: ILockingMechanismUnlockEntryRequestParams
    ): Promise<ILockingMechanismLockRecord>;
}

export interface Context extends CmsContext, IWebsocketsContext {
    lockingMechanism: ILockingMechanism;
}
