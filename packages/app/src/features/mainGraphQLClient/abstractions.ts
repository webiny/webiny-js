import { createAbstraction } from "@webiny/feature/admin";
import type { DocumentNode } from "graphql";

type IHeaders = Record<string, string | number | undefined>;

type MainGraphQLRequest<TVariables = any> = {
    query: DocumentNode | string;
    variables?: TVariables;
    headers?: IHeaders;
};

export interface IMainGraphQLClient {
    execute<TResult = any, TVariables = any>(
        params: MainGraphQLRequest<TVariables>
    ): Promise<TResult>;
}

export const MainGraphQLClient = createAbstraction<IMainGraphQLClient>("MainGraphQLClient");

export namespace MainGraphQLClient {
    export type Headers = IHeaders;
    export type Interface = IMainGraphQLClient;
    export type Request<TVariables = any> = MainGraphQLRequest<TVariables>;
}
