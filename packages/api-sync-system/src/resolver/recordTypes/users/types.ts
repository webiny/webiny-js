import type { IDeployment } from "~/resolver/deployment/types";
import type {
    CognitoIdentityProviderClient,
    CognitoIdentityProviderClientConfig
} from "@webiny/aws-sdk/client-cognito-identity-provider/index.js";
import type { InvokeCommandOutput } from "@webiny/aws-sdk/client-lambda/index.js";

export interface IUserDeploymentServices {
    cognitoUserPoolId: string;
}

export interface ICopyUserHandleParams {
    username: string;
    source: Pick<IDeployment<IUserDeploymentServices>, "region" | "services">;
    target: Pick<IDeployment<IUserDeploymentServices>, "region" | "services">;
}

export interface ICopyUser {
    handle(params: ICopyUserHandleParams): Promise<InvokeCommandOutput | null>;
}

export interface IDeleteUserHandleParams {
    username: string;
    target: Pick<IDeployment<IUserDeploymentServices>, "region" | "services">;
}

export interface IDeleteUser {
    handle(params: IDeleteUserHandleParams): Promise<InvokeCommandOutput | null>;
}

export interface ICreateCognitoIdentityProviderClientCb {
    (config: Partial<CognitoIdentityProviderClientConfig>): Pick<
        CognitoIdentityProviderClient,
        "send"
    >;
}
