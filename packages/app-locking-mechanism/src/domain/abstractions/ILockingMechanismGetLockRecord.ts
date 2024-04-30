import { ILockingMechanismError, ILockingMechanismLockRecord } from "~/types";

export interface ILockingMechanismGetLockRecordExecuteParams {
    id: string;
    type: string;
}

export interface ILockingMechanismGetLockRecordExecuteResult {
    data: ILockingMechanismLockRecord | null;
    error: ILockingMechanismError | null;
}

export interface ILockingMechanismGetLockRecord {
    execute(
        params: ILockingMechanismGetLockRecordExecuteParams
    ): Promise<ILockingMechanismGetLockRecordExecuteResult>;
}
