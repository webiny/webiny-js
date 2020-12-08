// import { HandlerApolloServerOptions } from "@webiny/handler-graphql/types";

// We can rely on the default "handler" and "handler-graphql-create-schema" plugins...
// TODO: createSchema no longer exists, @see packages/api-headless-cms/src/content/apolloHandler/createApolloHandler.ts
// import { createHandlerApolloServer /*createSchema*/ } from "@webiny/handler-graphql/plugins";

// ...but a custom "handler-graphql-create-handler" plugin is needed.
// import apolloHandler from "./apolloHandler";

// This is a factory function which returns a specific set of plugins depending on
// the provided environment and schema type (read, manage, preview).
import headlessPlugins from "./plugins";
import { createGraphQLHandler } from "./createGraphQLHandler";
import { extractHandlerHttpParameters } from "@webiny/api-headless-cms/content/helpers";

export default (options: any) => [
    {
        type: "handler",
        name: "handler-setup-headless-plugins",
        async handle(context, next) {
            // We register plugins according to the received path params (schema type and environment).
            const { type, environment, locale } = extractHandlerHttpParameters(context);
            context.plugins.register(
                await headlessPlugins({
                    type,
                    environment,
                    locale
                })
            );
            return next();
        }
    },
    createGraphQLHandler(options)
    // createHandlerApolloServer(options),
    // createSchema,
    // apolloHandler
];
