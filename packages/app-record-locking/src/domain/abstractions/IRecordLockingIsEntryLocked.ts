export interface IRecordLockingIsEntryLockedParams {
    id: string;
    type: string;
}

export type IRecordLockingIsEntryLockedResult = boolean;

export interface IRecordLockingIsEntryLocked {
    execute(params: IRecordLockingIsEntryLockedParams): Promise<IRecordLockingIsEntryLockedResult>;
}
