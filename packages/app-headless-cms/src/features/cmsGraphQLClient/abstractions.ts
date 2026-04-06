import { createAbstraction } from "@webiny/feature/admin";
import type { DocumentNode } from "graphql";

type IHeaders = Record<string, string | number | undefined>;

type CmsGraphQLRequest<TVariables = any> = {
    query: DocumentNode | string;
    variables?: TVariables;
    headers?: IHeaders;
};

export interface ICmsGraphQLClient {
    execute<TResult = any, TVariables = any>(
        params: CmsGraphQLRequest<TVariables>
    ): Promise<TResult>;
}

export const CmsGraphQLClient = createAbstraction<ICmsGraphQLClient>("CmsGraphQLClient");

export namespace CmsGraphQLClient {
    export type Headers = IHeaders;
    export type Interface = ICmsGraphQLClient;
    export type Request<TVariables = any> = CmsGraphQLRequest<TVariables>;
}
