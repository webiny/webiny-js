import { createAbstraction } from "@webiny/feature/admin";

export interface IUpdateCurrentUserGatewayParams {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    avatar?: { src?: string };
}

export interface IUpdateCurrentUserGatewayResult {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: any;
    external: boolean;
}

export interface IUpdateCurrentUserGateway {
    execute(params: IUpdateCurrentUserGatewayParams): Promise<IUpdateCurrentUserGatewayResult>;
}

export const UpdateCurrentUserGateway = createAbstraction<IUpdateCurrentUserGateway>(
    "Cognito/UpdateCurrentUserGateway"
);

export namespace UpdateCurrentUserGateway {
    export type Interface = IUpdateCurrentUserGateway;
    export type Params = IUpdateCurrentUserGatewayParams;
    export type Result = IUpdateCurrentUserGatewayResult;
}
