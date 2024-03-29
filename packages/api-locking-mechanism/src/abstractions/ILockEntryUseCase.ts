import { ILockingMechanismLockRecord, ILockingMechanismLockRecordEntryType } from "~/types";

export interface ILockEntryUseCaseExecuteParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface ILockEntryUseCaseExecute {
    (params: ILockEntryUseCaseExecuteParams): Promise<ILockingMechanismLockRecord>;
}

export interface ILockEntryUseCase {
    execute: ILockEntryUseCaseExecute;
}
