import { HandlerApolloServerOptions } from "@webiny/handler-apollo-server/types";

// We can rely on the default "handler" and "handler-apollo-server-create-schema" plugins...
import { createHandlerApolloServer, createSchema } from "@webiny/handler-apollo-server/plugins";

// ...but a custom "handler-apollo-server-create-handler" plugin is needed.
import apolloHandler from "./apolloHandler";

// This is a factory function which returns a specific set of plugins depending on
// the provided environment and schema type (read, manage, preview).
import headlessPlugins from "./plugins";

export default (options: HandlerApolloServerOptions) => [
    headlessPlugins(),
    createHandlerApolloServer(options),
    createSchema,
    apolloHandler
];
