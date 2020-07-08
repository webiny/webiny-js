import { createHandler } from "@webiny/handler";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import dbProxy from "@webiny/api-plugin-commodo-db-proxy";
import securityServicePlugins from "@webiny/api-security/plugins/service";
import myPlugins from "./plugins";

/**
 * This is the Apollo GraphQL Service handler.
 *
 * Consisting of a couple of base plugins, like the Apollo Server and database driver plugins, it enables you
 * to quickly and easily get started with the creation of a brand new GraphQL service.
 *
 * @see https://docs.webiny.com/docs/api-development/introduction
 */
export const handler = createHandler(
    // A set of plugins, responsible for setting up the Apollo Server.
    apolloServerPlugins({
        debug: process.env.DEBUG,
        server: {
            introspection: process.env.GRAPHQL_INTROSPECTION,
            playground: process.env.GRAPHQL_PLAYGROUND
        }
    }),

    // Configures the DB Proxy Commodo driver. Check out the following post to learn more about DB Proxy:
    // https://blog.webiny.com/using-aws-lambda-to-create-a-mongodb-connection-proxy-2bb53c4a0af4
    dbProxy({ functionName: process.env.DB_PROXY_FUNCTION }),

    // Base security plugins, that enable you to protect your GraphQL on a per-field level.
    securityServicePlugins({
        token: {
            expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
            secret: process.env.JWT_TOKEN_SECRET
        },
        validateAccessTokenFunction: process.env.VALIDATE_ACCESS_TOKEN_FUNCTION
    }),

    // Finally, this represents your plugins. Feel free to add anything that you might need.
    myPlugins()
);
