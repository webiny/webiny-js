import { createAbstraction } from "@webiny/feature/admin";

export interface ICreateUserGatewayResult {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: any;
    createdOn: string;
    external: boolean;
}

export interface ICreateUserGatewayParams {
    data: Record<string, any>;
}

export interface ICreateUserGateway {
    execute(params: ICreateUserGatewayParams): Promise<ICreateUserGatewayResult>;
}

export const CreateUserGateway = createAbstraction<ICreateUserGateway>("CreateUserGateway");

export namespace CreateUserGateway {
    export type Interface = ICreateUserGateway;
    export type Params = ICreateUserGatewayParams;
    export type Result = ICreateUserGatewayResult;
}
