import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";

export interface ILockingMechanismUnlockEntryParams {
    id: string;
    type: string;
    force?: boolean;
}

export interface ILockingMechanismUnlockEntryResult {
    data: ILockingMechanismLockRecord | null;
    error: ILockingMechanismError | null;
}

export interface ILockingMechanismUnlockEntry {
    execute(
        params: ILockingMechanismUnlockEntryParams
    ): Promise<ILockingMechanismUnlockEntryResult>;
}
