import { createAbstraction } from "@webiny/feature/admin";
import type { IRecordLockingIdentity, IRecordLockingLockRecord } from "~/types.js";

export type RecordLockingStatus =
    | "checking"
    | "locked"
    | "acquired"
    | "kicked-out"
    | "error"
    | null;

export interface IRecordLockingViewModel {
    status: RecordLockingStatus;
    lockRecord: IRecordLockingLockRecord | null;
    lockedByUserName: string | null;
    canForceUnlock: boolean;
    canEdit: boolean;
}

export interface IKickOutData {
    record: IRecordLockingLockRecord;
    user: IRecordLockingIdentity;
}

export interface IRecordLockingPresenter {
    readonly vm: IRecordLockingViewModel;
    init(entryId: string, type: string): Promise<void>;
    refreshLock(): Promise<void>;
    forceUnlock(): Promise<boolean>;
    handleKickOut(data: IKickOutData): void;
    dispose(): void;
}

export const RecordLockingPresenter =
    createAbstraction<IRecordLockingPresenter>("RecordLockingPresenter");

export namespace RecordLockingPresenter {
    export type Interface = IRecordLockingPresenter;
    export type ViewModel = IRecordLockingViewModel;
}
