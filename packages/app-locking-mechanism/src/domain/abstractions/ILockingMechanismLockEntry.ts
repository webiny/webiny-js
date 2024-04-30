import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";

export interface ILockingMechanismLockEntryParams {
    id: string;
    type: string;
}

export interface ILockingMechanismLockEntryResult {
    data: ILockingMechanismLockRecord | null;
    error: ILockingMechanismError | null;
}

export interface ILockingMechanismLockEntry {
    execute(params: ILockingMechanismLockEntryParams): Promise<ILockingMechanismLockEntryResult>;
}
