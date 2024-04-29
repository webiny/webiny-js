import {
    ILockingMechanismError,
    ILockingMechanismLockRecord,
    ILockingMechanismMeta
} from "~/types";

export interface ILockingMechanismListLockRecordsParamsWhere {
    id_in?: string[];
    type?: string;
}

export interface ILockingMechanismListLockRecordsParams {
    where?: ILockingMechanismListLockRecordsParamsWhere;
    sort?: string[];
    limit?: number;
    after?: string;
}

export interface ILockingMechanismListLockRecordsResult {
    data: ILockingMechanismLockRecord[] | null;
    error: ILockingMechanismError | null;
    meta: ILockingMechanismMeta | null;
}

export interface ILockingMechanismListLockRecords {
    execute(
        params: ILockingMechanismListLockRecordsParams
    ): Promise<ILockingMechanismListLockRecordsResult>;
}
