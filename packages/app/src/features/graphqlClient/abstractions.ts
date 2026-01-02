import { createAbstraction } from "@webiny/feature/admin";
import type { DocumentNode } from "graphql";

type IHeaders = Record<string, string | number | undefined>;

type GraphQLRequest<TVariables = any> = {
    query: DocumentNode | string;
    variables?: TVariables;
    headers?: IHeaders;
};

export interface IGraphQLClient {
    execute<TResult = any, TVariables = any>(params: GraphQLRequest<TVariables>): Promise<TResult>;
}
export const GraphQLClient = createAbstraction<IGraphQLClient>("GraphQLClient");

export namespace GraphQLClient {
    export type Headers = IHeaders;
    export type Interface = IGraphQLClient;
    export type Request<TVariables = any> = GraphQLRequest<TVariables>;
}
