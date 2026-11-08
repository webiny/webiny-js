import { createAbstraction } from "@webiny/feature/admin";

export interface IResetUserMfaGatewayParams {
    id: string;
}

export interface IResetUserMfaGateway {
    execute(params: IResetUserMfaGatewayParams): Promise<boolean>;
}

export const ResetUserMfaGateway = createAbstraction<IResetUserMfaGateway>("ResetUserMfaGateway");

export namespace ResetUserMfaGateway {
    export type Interface = IResetUserMfaGateway;
    export type Params = IResetUserMfaGatewayParams;
}
