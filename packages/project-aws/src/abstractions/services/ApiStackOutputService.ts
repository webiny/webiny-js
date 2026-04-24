import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";

export interface IApiStackOutput {
    apiDomain?: string;
    apiUrl?: string;
    graphqlLambdaRole?: string;
    graphqlLambdaRoleName?: string;
    cognitoAppClientId?: string;
    cognitoUserPoolId?: string;
    cognitoUserPoolPasswordPolicy?: string;
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
