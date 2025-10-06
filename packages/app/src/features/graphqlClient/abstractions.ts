import { Abstraction } from "@webiny/di-container";
import type { DocumentNode } from "graphql";

type GraphQLRequest<TVariables = any> =
    | {
          query: DocumentNode | string;
          mutation?: never;
          variables?: TVariables;
          headers?: Record<string, string>;
      }
    | {
          mutation: DocumentNode | string;
          query?: never;
          variables?: TVariables;
          headers?: Record<string, string>;
      };

export interface IGraphQLClient {
    execute<TVariables = any, TResult = any>(params: GraphQLRequest<TVariables>): Promise<TResult>;
}
export const GraphQLClient = new Abstraction<IGraphQLClient>("GraphQLClient");

export namespace GraphQLClient {
    export type Interface = IGraphQLClient;
    export type Request<TVariables = any> = GraphQLRequest<TVariables>;
}
