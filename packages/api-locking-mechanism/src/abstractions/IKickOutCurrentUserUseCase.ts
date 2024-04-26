import { ILockingMechanismLockRecord } from "~/types";

export type IKickOutCurrentUserUseCaseExecuteParams = ILockingMechanismLockRecord;

export interface IKickOutCurrentUserUseCase {
    execute(params: IKickOutCurrentUserUseCaseExecuteParams): Promise<void>;
}
