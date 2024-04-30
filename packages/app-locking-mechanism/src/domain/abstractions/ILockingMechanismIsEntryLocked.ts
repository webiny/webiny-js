export interface ILockingMechanismIsEntryLockedParams {
    id: string;
    type: string;
}

export type ILockingMechanismIsEntryLockedResult = boolean;

export interface ILockingMechanismIsEntryLocked {
    execute(
        params: ILockingMechanismIsEntryLockedParams
    ): Promise<ILockingMechanismIsEntryLockedResult>;
}
