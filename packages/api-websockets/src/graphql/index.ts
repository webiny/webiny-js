import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { createTypeDefs } from "./createTypeDefs";
import { createResolvers } from "./createResolvers";

export const createWebsocketsGraphQL = () => {
    const plugin = new GraphQLSchemaPlugin({
        typeDefs: createTypeDefs(),
        resolvers: createResolvers()
    });

    plugin.name = "websockets.graphql";

    return plugin;
};
