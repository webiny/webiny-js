import { HttpHandlerApolloServerOptions } from "@webiny/http-handler-apollo-server/types";

// We can rely on the default "handler" and "handler-apollo-server-create-schema" plugins...
import {
    createHandlerApolloServer,
    createSchema
} from "@webiny/http-handler-apollo-server/plugins";

// ...but a custom "handler-apollo-server-create-handler" plugin is needed.
import apolloHandler from "./apolloHandler";

// This is a factory function which returns a specific set of plugins depending on
// the provided environment and schema type (read, manage, preview).
import headlessPlugins from "./plugins";

export default (options: HttpHandlerApolloServerOptions = {}) => [
    createHandlerApolloServer(options),
    createSchema,
    apolloHandler,
    {
        type: "before-handler",
        name: "before-handler-setup-headless-plugins",
        async handle({ args, context }) {
            // We register plugins according to the received path params (schema type and environment).
            const [event] = args;
            const { key = "" } = event.pathParameters || {};
            const [type = null, environment = null] = key.split("/");
            context.plugins.register(await headlessPlugins({ type, environment }));
        }
    }
];
