import { createAbstraction } from "@webiny/feature/admin";

export interface IListUsersGatewayResult {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: any;
    createdOn: string;
    external: boolean;
}

export interface IListUsersGateway {
    execute(): Promise<IListUsersGatewayResult[]>;
}

export const ListUsersGateway = createAbstraction<IListUsersGateway>("ListUsersGateway");

export namespace ListUsersGateway {
    export type Interface = IListUsersGateway;
    export type Result = IListUsersGatewayResult;
}
