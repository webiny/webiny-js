import { ILockingMechanismLockRecord, ILockingMechanismLockRecordEntryType } from "~/types";

export interface IUnlockEntryUseCaseExecuteParams {
    id: string;
    type: ILockingMechanismLockRecordEntryType;
    force?: boolean;
}

export interface IUnlockEntryUseCaseExecute {
    (params: IUnlockEntryUseCaseExecuteParams): Promise<ILockingMechanismLockRecord>;
}

export interface IUnlockEntryUseCase {
    execute: IUnlockEntryUseCaseExecute;
}
