import { createAbstraction } from "@webiny/feature/admin";
import type { IGetUserGatewayResult } from "./GetUserGateway.js";

export type IGetUserUseCaseResult = IGetUserGatewayResult;

export interface IGetUserUseCaseParams {
    id: string;
}

export interface IGetUserUseCase {
    execute(params: IGetUserUseCaseParams): Promise<IGetUserUseCaseResult>;
}

export const GetUserUseCase = createAbstraction<IGetUserUseCase>("GetUserUseCase");

export namespace GetUserUseCase {
    export type Interface = IGetUserUseCase;
    export type Params = IGetUserUseCaseParams;
    export type Result = IGetUserUseCaseResult;
}
