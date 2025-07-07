import type { IDeployment } from "~/resolver/deployment/types";
import type { CognitoIdentityProviderClient } from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import type { InvokeCommandOutput } from "@webiny/aws-sdk/client-lambda/index.js";

export interface ICopyUserHandleParams {
    username: string;
    source: IDeployment;
    target: IDeployment;
}

export interface ICopyUser {
    handle(params: ICopyUserHandleParams): Promise<InvokeCommandOutput | null>;
}

export interface IDeleteUserHandleParams {
    username: string;
    target: IDeployment;
}

export interface IDeleteUser {
    handle(params: IDeleteUserHandleParams): Promise<InvokeCommandOutput | null>;
}

export interface ICreateCognitoIdentityProviderClientCb {
    (region: string): Pick<CognitoIdentityProviderClient, "send">;
}
