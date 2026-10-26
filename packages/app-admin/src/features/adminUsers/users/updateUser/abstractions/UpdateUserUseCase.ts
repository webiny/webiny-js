import { createAbstraction } from "@webiny/feature/admin";
import type { IUpdateUserGatewayResult } from "./UpdateUserGateway.js";

export type IUpdateUserUseCaseResult = IUpdateUserGatewayResult;

export interface IUpdateUserUseCaseParams {
    id: string;
    data: Record<string, any>;
}

export interface IUpdateUserUseCase {
    execute(params: IUpdateUserUseCaseParams): Promise<IUpdateUserUseCaseResult>;
}

export const UpdateUserUseCase = createAbstraction<IUpdateUserUseCase>("UpdateUserUseCase");

export namespace UpdateUserUseCase {
    export type Interface = IUpdateUserUseCase;
    export type Params = IUpdateUserUseCaseParams;
    export type Result = IUpdateUserUseCaseResult;
}
