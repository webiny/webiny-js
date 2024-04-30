import { ILockingMechanismLockRecord, ILockingMechanismLockRecordEntryType } from "~/types";

export interface IUpdateEntryLockUseCaseExecuteParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface IUpdateEntryLockUseCaseExecute {
    (params: IUpdateEntryLockUseCaseExecuteParams): Promise<ILockingMechanismLockRecord>;
}

export interface IUpdateEntryLockUseCase {
    execute: IUpdateEntryLockUseCaseExecute;
}
