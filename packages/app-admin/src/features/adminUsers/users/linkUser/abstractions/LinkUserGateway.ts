import { createAbstraction } from "@webiny/feature/admin";
import type { ICreateUserGatewayResult } from "../../createUser/abstractions/index.js";

export type ILinkUserGatewayResult = ICreateUserGatewayResult;

export interface ILinkUserGatewayParams {
    data: {
        email: string;
        roles?: unknown[];
        teams?: unknown[];
    };
}

export interface ILinkUserGateway {
    execute(params: ILinkUserGatewayParams): Promise<ILinkUserGatewayResult>;
}

export const LinkUserGateway = createAbstraction<ILinkUserGateway>("LinkUserGateway");

export namespace LinkUserGateway {
    export type Interface = ILinkUserGateway;
    export type Params = ILinkUserGatewayParams;
    export type Result = ILinkUserGatewayResult;
}
