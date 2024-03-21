import { CmsIdentity, CmsModelManager } from "~/types";

export type ICmsModelLockRecordManager = CmsModelManager<IHeadlessCmsLockRecordValues>;

export interface IHeadlessCmsLockRecordValues {
    targetId: string;
    type: IHeadlessCmsLockRecordEntryType;
}

export interface IHeadlessCmsLockRecord {
    id: string;
    targetId: string;
    type: IHeadlessCmsLockRecordEntryType;
    lockedBy: CmsIdentity;
    lockedOn: Date;
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

export interface IHeadlessCmsLockingMechanism {
    getLockRecord(id: string): Promise<IHeadlessCmsLockRecord | null>;
    isEntryLocked(params: IHeadlessCmsLockingMechanismIsLockedParams): Promise<boolean>;
    lockEntry(params: IHeadlessCmsLockingMechanismLockEntryParams): Promise<IHeadlessCmsLockRecord>;
    unlockEntry(params: IHeadlessCmsLockingMechanismUnlockEntryParams): Promise<void>;
}
