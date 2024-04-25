import { CmsIdentity } from "@webiny/api-headless-cms/types";

export interface IKickOutCurrentUserUseCaseExecuteParams {
    lockedBy: CmsIdentity;
    id: string;
}

export interface IKickOutCurrentUserUseCase {
    execute(params: IKickOutCurrentUserUseCaseExecuteParams): Promise<void>;
}
