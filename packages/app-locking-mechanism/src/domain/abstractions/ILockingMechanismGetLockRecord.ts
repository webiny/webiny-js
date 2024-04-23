import { ILockingMechanismRecord } from "~/types";

export interface ILockingMechanismGetLockRecordParams {
    id: string;
    type: string;
}

export type ILockingMechanismGetLockRecordResult = ILockingMechanismRecord;

export interface ILockingMechanismGetLockRecord {
    execute(
        params: ILockingMechanismGetLockRecordParams
    ): Promise<ILockingMechanismGetLockRecordResult>;
}
