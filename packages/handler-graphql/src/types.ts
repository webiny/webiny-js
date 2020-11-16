import { GraphQLScalarType, GraphQLFieldResolver } from "graphql";
import { Plugin } from "@webiny/plugins/types";

export type GraphQLScalarPlugin = Plugin & {
    type: "graphql-scalar";
    scalar: GraphQLScalarType;
};

export interface HandlerGraphQLOptions {
    debug?: boolean | string;
    server?: {
        introspection?: boolean | string;
        playground?: boolean | string;
    };
    handler?: {
        cors?: { [key: string]: any };
    };
}

// `GraphQLSchemaPlugin` types.
export type Types = string | (() => string | Promise<string>);

export type GraphQLSchemaPluginTypeArgs = {
    context?: any;
    args?: any;
    source?: any;
};

export type Resolvers =
    | GraphQLFieldResolver<any, any, any>
    | { [property: string]: Resolvers };

export type GraphQLSchemaPlugin = Plugin<{
    type: "graphql-schema";
    /*prepare?: (params: { context: T }) => Promise<void>;*/ // TODO: is this necessary?
    schema: {
        typeDefs: Types;
        resolvers: Resolvers;
    };
}>;
