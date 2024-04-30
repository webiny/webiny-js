import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";

export interface ILockingMechanismGetLockedEntryLockRecordExecuteParams {
    id: string;
    type: string;
}

export interface ILockingMechanismGetLockedEntryLockRecordExecuteResult {
    data: ILockingMechanismLockRecord | null;
    error: ILockingMechanismError | null;
}

export interface ILockingMechanismGetLockedEntryLockRecord {
    execute(
        params: ILockingMechanismGetLockedEntryLockRecordExecuteParams
    ): Promise<ILockingMechanismGetLockedEntryLockRecordExecuteResult>;
}
