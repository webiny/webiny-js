import { ILockingMechanismRecord } from "~/types";

export interface ILockingMechanismGetLockRecordParams {
    id: string;
    type: string;
}

export interface ILockingMechanismGetLockRecordResult extends ILockingMechanismRecord {}

export interface ILockingMechanismGetLockRecord {
    execute(
        params: ILockingMechanismGetLockRecordParams
    ): Promise<ILockingMechanismGetLockRecordResult>;
}
