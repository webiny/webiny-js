import { HttpHandlerContext } from "@webiny/http-handler/types";
import { GraphQLSchema } from "graphql";
import { Plugin } from "@webiny/plugins/types";

export interface HttpHandlerApolloServerOptions {
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
    type: "handler-apollo-server-create";
    create(params: {
        options: HttpHandlerApolloServerOptions;
        context: HttpHandlerContext;
    }): CreateApolloHandlerPluginCreateResponse | Promise<CreateApolloHandlerPluginCreateResponse>;
};
