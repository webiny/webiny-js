import { createAbstraction } from "@webiny/feature/admin";

export interface IDeleteUserGatewayParams {
    id: string;
}

export interface IDeleteUserGateway {
    execute(params: IDeleteUserGatewayParams): Promise<boolean>;
}

export const DeleteUserGateway = createAbstraction<IDeleteUserGateway>("DeleteUserGateway");

export namespace DeleteUserGateway {
    export type Interface = IDeleteUserGateway;
    export type Params = IDeleteUserGatewayParams;
}
