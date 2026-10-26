import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";

/**
 * The Cognito user pool's `passwordPolicy`, as the API stack outputs it. The admin reads the rule
 * fields from `WEBINY_ADMIN_PASSWORD_POLICY`, in the shape of app-admin's `PasswordPolicy.Rules`.
 */
export interface IApiStackOutputPasswordPolicy {
    minimumLength?: number;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
    requireUppercase?: boolean;
    temporaryPasswordValidityDays?: number;
}

export interface IApiStackOutput {
    apiDomain?: string;
    apiUrl?: string;
    graphqlLambdaRole?: string;
    graphqlLambdaRoleName?: string;
    cognitoAppClientId?: string;
    cognitoUserPoolId?: string;
    cognitoUserPoolPasswordPolicy?: IApiStackOutputPasswordPolicy;
    dynamoDbTable?: string;
    region?: string;
    websocketApiId?: string;
    websocketApiUrl?: string;
    graphqlLambdaName?: string;
    backgroundTaskLambdaArn?: string;
    backgroundTaskStepFunctionArn?: string;
    fileManagerManageLambdaArn?: string;
    fileManagerManageLambdaRole?: string;
    fileManagerManageLambdaRoleName?: string;
    fileManagerDownloadLambdaArn?: string;
    [key: string]: any;
}

export interface IApiStackOutputService {
    execute<TOutput extends IApiStackOutput = IApiStackOutput>(): Promise<TOutput | null>;
}

export const ApiStackOutputService =
    createAbstraction<IApiStackOutputService>("ApiStackOutputService");

export namespace ApiStackOutputService {
    export type Interface = IApiStackOutputService;
    export type Output = IApiStackOutput;
}
