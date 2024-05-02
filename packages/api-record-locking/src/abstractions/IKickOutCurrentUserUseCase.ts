import { IRecordLockingLockRecord } from "~/types";

export type IKickOutCurrentUserUseCaseExecuteParams = IRecordLockingLockRecord;

export interface IKickOutCurrentUserUseCase {
    execute(params: IKickOutCurrentUserUseCaseExecuteParams): Promise<void>;
}
