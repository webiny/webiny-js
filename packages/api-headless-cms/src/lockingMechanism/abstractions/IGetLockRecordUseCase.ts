import { IHeadlessCmsLockRecord } from "~/lockingMechanism/types";

export interface IGetLockRecordUseCaseExecute {
    (id: string): Promise<IHeadlessCmsLockRecord | null>;
}

export interface IGetLockRecordUseCase {
    execute: IGetLockRecordUseCaseExecute;
}
