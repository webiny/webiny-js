import { createAbstraction } from "@webiny/feature/admin";
import type { ILinkUserGatewayParams, ILinkUserGatewayResult } from "./LinkUserGateway.js";

export type ILinkUserUseCaseParams = ILinkUserGatewayParams;
export type ILinkUserUseCaseResult = ILinkUserGatewayResult;

/**
 * Gives a person whose account exists in another tenant access to the current tenant.
 */
export interface ILinkUserUseCase {
    execute(params: ILinkUserUseCaseParams): Promise<ILinkUserUseCaseResult>;
}

export const LinkUserUseCase = createAbstraction<ILinkUserUseCase>("LinkUserUseCase");

export namespace LinkUserUseCase {
    export type Interface = ILinkUserUseCase;
    export type Params = ILinkUserUseCaseParams;
    export type Result = ILinkUserUseCaseResult;
}
