import { createAbstraction } from "@webiny/feature/admin";
import type { DocumentNode } from "graphql";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { GraphQLExtensionsEvent } from "./GraphQLExtensionsEvent.js";

type IHeaders = Record<string, string | number | undefined>;

type GraphQLRequest<TVariables = any> = {
    endpoint: string;
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

export const GraphQLExtensionsEventHandler = createAbstraction<
    IEventHandler<GraphQLExtensionsEvent>
>("GraphQLExtensionsEventHandler");

export namespace GraphQLExtensionsEventHandler {
    export type Interface = IEventHandler<GraphQLExtensionsEvent>;
    export type Event = GraphQLExtensionsEvent;
}
