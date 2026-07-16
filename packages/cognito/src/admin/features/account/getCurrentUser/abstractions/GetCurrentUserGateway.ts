import { createAbstraction } from "@webiny/feature/admin";

export interface IGetCurrentUserGatewayResult {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: any;
    external: boolean;
}

export interface IGetCurrentUserGateway {
    execute(): Promise<IGetCurrentUserGatewayResult>;
}

export const GetCurrentUserGateway = createAbstraction<IGetCurrentUserGateway>(
    "Cognito/GetCurrentUserGateway"
);

export namespace GetCurrentUserGateway {
    export type Interface = IGetCurrentUserGateway;
    export type Result = IGetCurrentUserGatewayResult;
}
