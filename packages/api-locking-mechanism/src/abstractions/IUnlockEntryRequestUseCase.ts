import { ILockingMechanismLockRecord, ILockingMechanismLockRecordEntryType } from "~/types";

export interface IUnlockEntryRequestUseCaseExecuteParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
}

export interface IUnlockEntryRequestUseCaseExecute {
    (params: IUnlockEntryRequestUseCaseExecuteParams): Promise<ILockingMechanismLockRecord>;
}

export interface IUnlockEntryRequestUseCase {
    execute: IUnlockEntryRequestUseCaseExecute;
}
