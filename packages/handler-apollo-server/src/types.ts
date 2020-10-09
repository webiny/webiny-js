import { HandlerContext } from "@webiny/handler/types";
import { GraphQLSchema } from "graphql";
import { Plugin, PluginsContainer } from "@webiny/plugins/types";

export interface HandlerApolloServerOptions {
    debug?: boolean | string;
    server?: {
        introspection?: boolean | string;
        playground?: boolean | string;
    };
    handler?: {
        cors?: { [key: string]: any };
    };
}

type CreateApolloHandlerPluginCreateResponse = {
    handler: Function;
    schema: GraphQLSchema;
};

export type CreateApolloHandlerPlugin = Plugin & {
    name: "handler-apollo-server-create-handler";
    type: "handler-apollo-server-create-handler";
    create(params: {
        options: HandlerApolloServerOptions;
        context: HandlerContext;
    }): CreateApolloHandlerPluginCreateResponse | Promise<CreateApolloHandlerPluginCreateResponse>;
};

export type CreateSchemaPlugin = Plugin & {
    name: "handler-apollo-server-create-schema";
    type: "handler-apollo-server-create-schema";
    create(params: { plugins: PluginsContainer }): { schema: GraphQLSchema };
};
