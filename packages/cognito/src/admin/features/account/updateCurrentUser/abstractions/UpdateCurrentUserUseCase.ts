import { createAbstraction } from "@webiny/feature/admin";
import type { IUpdateCurrentUserGatewayParams } from "./UpdateCurrentUserGateway.js";
import type { IUpdateCurrentUserGatewayResult } from "./UpdateCurrentUserGateway.js";

export type IUpdateCurrentUserUseCaseParams = IUpdateCurrentUserGatewayParams;
export type IUpdateCurrentUserUseCaseResult = IUpdateCurrentUserGatewayResult;

export interface IUpdateCurrentUserUseCase {
    execute(params: IUpdateCurrentUserUseCaseParams): Promise<IUpdateCurrentUserUseCaseResult>;
}

export const UpdateCurrentUserUseCase = createAbstraction<IUpdateCurrentUserUseCase>(
    "Cognito/UpdateCurrentUserUseCase"
);

export namespace UpdateCurrentUserUseCase {
    export type Interface = IUpdateCurrentUserUseCase;
    export type Params = IUpdateCurrentUserUseCaseParams;
    export type Result = IUpdateCurrentUserUseCaseResult;
}
