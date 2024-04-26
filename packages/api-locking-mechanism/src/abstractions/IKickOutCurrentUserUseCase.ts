import { ILockingMechanismIdentity } from "~/types";

export interface IKickOutCurrentUserUseCaseExecuteParams {
    lockedBy: ILockingMechanismIdentity;
    id: string;
}

export interface IKickOutCurrentUserUseCase {
    execute(params: IKickOutCurrentUserUseCaseExecuteParams): Promise<void>;
}
