import { CmsIdentity, CmsModelManager } from "~/types";

export type ICmsModelLockRecordManager = CmsModelManager<IHeadlessCmsLockRecordValues>;

export interface IHeadlessCmsLockRecordValues {
    targetId: string;
    type: IHeadlessCmsLockRecordEntryType;
    actions?: IHeadlessCmsLockRecordAction[];
}
export enum IHeadlessCmsLockRecordActionType {
    request = "requested",
    approved = "approved",
    denied = "denied"
}

export interface IHeadlessCmsLockRecordRequestedAction {
    type: IHeadlessCmsLockRecordActionType.request;
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
//
// export interface IHeadlessCmsLockRecordAction {
//     action: IHeadlessCmsLockRecordActionAction;
//     message?: string;
//     createdOn: Date;
//     createdBy: CmsIdentity;
// }

export interface IHeadlessCmsLockRecord {
    id: string;
    targetId: string;
    type: IHeadlessCmsLockRecordEntryType;
    lockedBy: CmsIdentity;
    lockedOn: Date;
    actions?: IHeadlessCmsLockRecordAction[];
    addAction(action: IHeadlessCmsLockRecordAction): void;
    getUnlockRequested(): IHeadlessCmsLockRecordRequestedAction | undefined;
    getUnlockApproved(): IHeadlessCmsLockRecordApprovedAction | undefined;
    getUnlockDenied(): IHeadlessCmsLockRecordDeniedAction | undefined;
}

/**
 * Do not use any special chars other than #, as we use this to create lock record IDs.
 */
export type IHeadlessCmsLockRecordEntryType = "pb#page" | `cms#${string}`;

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

export interface IHeadlessCmsLockingMechanism {
    getLockRecord(id: string): Promise<IHeadlessCmsLockRecord | null>;
    isEntryLocked(params: IHeadlessCmsLockingMechanismIsLockedParams): Promise<boolean>;
    lockEntry(params: IHeadlessCmsLockingMechanismLockEntryParams): Promise<IHeadlessCmsLockRecord>;
    unlockEntry(params: IHeadlessCmsLockingMechanismUnlockEntryParams): Promise<void>;
    unlockEntryRequest(
        params: IHeadlessCmsLockingMechanismUnlockEntryRequestParams
    ): Promise<IHeadlessCmsLockRecord>;
}
