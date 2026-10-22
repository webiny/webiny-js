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

export interface IUpdateUserGatewayResult {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: any;
    external: boolean;
    roles: IUserRoleRef[];
    teams: IUserTeamRef[];
}

export interface IUpdateUserGatewayParams {
    id: string;
    data: Record<string, any>;
}

export interface IUpdateUserGateway {
    execute(params: IUpdateUserGatewayParams): Promise<IUpdateUserGatewayResult>;
}

export const UpdateUserGateway = createAbstraction<IUpdateUserGateway>("UpdateUserGateway");

export namespace UpdateUserGateway {
    export type Interface = IUpdateUserGateway;
    export type Params = IUpdateUserGatewayParams;
    export type Result = IUpdateUserGatewayResult;
}
