import { createAbstraction } from "@webiny/feature/admin";
import type { IGetCurrentUserGatewayResult } from "./GetCurrentUserGateway.js";

export type IGetCurrentUserUseCaseResult = IGetCurrentUserGatewayResult;

export interface IGetCurrentUserUseCase {
    execute(): Promise<IGetCurrentUserUseCaseResult>;
}

export const GetCurrentUserUseCase = createAbstraction<IGetCurrentUserUseCase>(
    "Cognito/GetCurrentUserUseCase"
);

export namespace GetCurrentUserUseCase {
    export type Interface = IGetCurrentUserUseCase;
    export type Result = IGetCurrentUserUseCaseResult;
}
