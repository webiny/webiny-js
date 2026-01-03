import { createAbstraction } from "@webiny/project/abstractions/createAbstraction.js";

export interface ICoreStackOutput {
    region?: string;
    deploymentId?: string;
    databaseSetup?: string;
    elasticsearchDomainEndpoint?: string;
    elasticsearchDomainArn?: string;
    [key: string]: any;
}

export interface ICoreStackOutputService {
    execute<TOutput extends ICoreStackOutput = ICoreStackOutput>(): Promise<TOutput | null>;
}

export const CoreStackOutputService =
    createAbstraction<ICoreStackOutputService>("CoreStackOutputService");

export namespace CoreStackOutputService {
    export type Interface = ICoreStackOutputService;
    export type Output = ICoreStackOutput;
}
