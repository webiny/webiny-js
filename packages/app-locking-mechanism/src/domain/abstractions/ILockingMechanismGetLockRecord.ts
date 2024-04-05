export interface ILockingMechanismGetLockRecordParams {
    id: string;
    type: string;
}

export interface ILockingMechanismGetLockRecordResult {}

export interface ILockingMechanismGetLockRecord {
    execute(
        params: ILockingMechanismGetLockRecordParams
    ): Promise<ILockingMechanismGetLockRecordResult>;
}
