import { createAbstraction } from "@webiny/feature/admin";
import type { IRecordLockingLockRecord } from "~/types.js";

export interface IListLockRecordsViewModel {
    lockedCount: number;
}

export interface IListLockRecordsPresenter {
    readonly vm: IListLockRecordsViewModel;
    fetchForEntries(entryIds: string[], type: string): Promise<void>;
    isLocked(entryId: string): boolean;
    getLockRecord(entryId: string): IRecordLockingLockRecord | undefined;
    dispose(): void;
}

export const ListLockRecordsPresenter = createAbstraction<IListLockRecordsPresenter>(
    "ListLockRecordsPresenter"
);

export namespace ListLockRecordsPresenter {
    export type Interface = IListLockRecordsPresenter;
    export type ViewModel = IListLockRecordsViewModel;
}
