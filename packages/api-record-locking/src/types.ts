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

export type IRecordLockingIdentity = CmsIdentity;

export type IRecordLockingModelManager = CmsModelManager<IRecordLockingLockRecordValues>;

export type IRecordLockingMeta = CmsEntryMeta;

export interface IHasFullAccessCallable {
    (): Promise<boolean>;
}

export interface IGetWebsocketsContextCallable {
    (): IWebsocketsContextObject;
}

export interface IGetIdentity {
    (): IRecordLockingIdentity;
}

export interface IRecordLockingLockRecordValues {
    targetId: string;
    type: IRecordLockingLockRecordEntryType;
    actions?: IRecordLockingLockRecordAction[];
}
export enum IRecordLockingLockRecordActionType {
    requested = "requested",
    approved = "approved",
    denied = "denied"
}

export interface IRecordLockingLockRecordRequestedAction {
    type: IRecordLockingLockRecordActionType.requested;
    message?: string;
    createdOn: Date;
    createdBy: IRecordLockingIdentity;
}

export interface IRecordLockingLockRecordApprovedAction {
    type: IRecordLockingLockRecordActionType.approved;
    message?: string;
    createdOn: Date;
    createdBy: IRecordLockingIdentity;
}

export interface IRecordLockingLockRecordDeniedAction {
    type: IRecordLockingLockRecordActionType.denied;
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

export interface IRecordLockingListAllLockRecordsResponse {
    items: IRecordLockingLockRecord[];
    meta: IRecordLockingMeta;
}

export type IRecordLockingListLockRecordsResponse = IRecordLockingListAllLockRecordsResponse;

export interface IRecordLockingGetLockRecordParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
}

export interface IRecordLockingIsLockedParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
}

export interface IRecordLockingGetLockedEntryLockRecordParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
}

export interface IRecordLockingLockEntryParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
}

export interface IRecordLockingUpdateEntryLockParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
}

export interface IRecordLockingUnlockEntryParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
    force?: boolean;
}

export interface IRecordLockingUnlockEntryRequestParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
}

export interface OnEntryBeforeLockTopicParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
}

export interface OnEntryAfterLockTopicParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
    record: IRecordLockingLockRecord;
}

export interface OnEntryLockErrorTopicParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
    error: CmsError;
}

export interface OnEntryBeforeUnlockTopicParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
    getIdentity: IGetIdentity;
}

export interface OnEntryAfterUnlockTopicParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
    record: IRecordLockingLockRecord;
}

export interface OnEntryUnlockErrorTopicParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
    error: CmsError;
}

export interface OnEntryBeforeUnlockRequestTopicParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
}

export interface OnEntryAfterUnlockRequestTopicParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
    record: IRecordLockingLockRecord;
}

export interface OnEntryUnlockRequestErrorTopicParams {
    id: string;
    type: IRecordLockingLockRecordEntryType;
    error: CmsError;
}

export interface IRecordLocking {
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
        params?: IRecordLockingListAllLockRecordsParams
    ): Promise<IRecordLockingListAllLockRecordsResponse>;
    /**
     * Same call as listAllLockRecords, except this one will filter out records with expired lock.
     */
    listLockRecords(
        params?: IRecordLockingListLockRecordsParams
    ): Promise<IRecordLockingListLockRecordsResponse>;
    getLockRecord(
        params: IRecordLockingGetLockRecordParams
    ): Promise<IRecordLockingLockRecord | null>;
    isEntryLocked(params: IRecordLockingIsLockedParams): Promise<boolean>;
    getLockedEntryLockRecord(
        params: IRecordLockingGetLockedEntryLockRecordParams
    ): Promise<IRecordLockingLockRecord | null>;
    lockEntry(params: IRecordLockingLockEntryParams): Promise<IRecordLockingLockRecord>;
    updateEntryLock(params: IRecordLockingUpdateEntryLockParams): Promise<IRecordLockingLockRecord>;
    unlockEntry(params: IRecordLockingUnlockEntryParams): Promise<IRecordLockingLockRecord>;
    unlockEntryRequest(
        params: IRecordLockingUnlockEntryRequestParams
    ): Promise<IRecordLockingLockRecord>;
}

export interface Context extends CmsContext, IWebsocketsContext {
    recordLocking: IRecordLocking;
}
