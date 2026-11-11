import { createAbstraction } from "@webiny/feature/admin";

export interface IUserRoleRef {
    id: string;
    slug: string;
    name: string;
}

export interface IUserTeamRef {
    id: string;
    slug: string;
    name: string;
}

export interface IGetUserGatewayResult {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: any;
    external: boolean;
    roles: IUserRoleRef[];
    teams: IUserTeamRef[];
}

export interface IGetUserGateway {
    execute(params: IGetUserGatewayParams): Promise<IGetUserGatewayResult>;
}

export interface IGetUserGatewayParams {
    id: string;
}

export const GetUserGateway = createAbstraction<IGetUserGateway>("GetUserGateway");

export namespace GetUserGateway {
    export type Interface = IGetUserGateway;
    export type Params = IGetUserGatewayParams;
    export type Result = IGetUserGatewayResult;
}
