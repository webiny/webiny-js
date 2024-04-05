export interface ILockingMechanismIsEntryLockedParams {
    id: string;
    type: string;
}

export interface ILockingMechanismIsEntryLockedResult {}

export interface ILockingMechanismIsEntryLocked {
    execute(
        params: ILockingMechanismIsEntryLockedParams
    ): Promise<ILockingMechanismIsEntryLockedResult>;
}
