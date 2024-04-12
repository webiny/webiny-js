import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";

export interface ILockingMechanismUpdateEntryLockExecuteParams {
    id: string;
    type: string;
}
export interface ILockingMechanismUpdateEntryLockExecuteResult {
    data: ILockingMechanismLockRecord | null;
    error: ILockingMechanismError | null;
}

export interface ILockingMechanismUpdateEntryLock {
    execute(
        params: ILockingMechanismUpdateEntryLockExecuteParams
    ): Promise<ILockingMechanismUpdateEntryLockExecuteResult>;
}
