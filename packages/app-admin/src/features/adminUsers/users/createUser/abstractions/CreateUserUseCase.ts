import { createAbstraction } from "@webiny/feature/admin";
import type { ICreateUserGatewayResult } from "./CreateUserGateway.js";

export type ICreateUserUseCaseResult = ICreateUserGatewayResult;

export interface ICreateUserUseCaseParams {
    data: Record<string, any>;
}

export interface ICreateUserUseCase {
    execute(params: ICreateUserUseCaseParams): Promise<ICreateUserUseCaseResult>;
}

export const CreateUserUseCase = createAbstraction<ICreateUserUseCase>("CreateUserUseCase");

export namespace CreateUserUseCase {
    export type Interface = ICreateUserUseCase;
    export type Params = ICreateUserUseCaseParams;
    export type Result = ICreateUserUseCaseResult;
}
