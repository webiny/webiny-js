import { HttpHandlerApolloServerOptions } from "@webiny/http-handler-apollo-server/types";

// We can rely on the default Apollo server and schema creation plugins...
import {
    createHandlerApolloServer,
    createSchema
} from "@webiny/http-handler-apollo-server/plugins";

// ...but a custom "handler-apollo-server-create" plugin is needed.
import apolloHandler from "./apolloHandler";

// Headless CMS models, GraphQL schema, fields, etc. This is a factory function which returns
// a different schema depending on the provided environment and schema type (read, manage, preview).
import headlessPlugins from "./plugins";

export default (options: HttpHandlerApolloServerOptions = {}) => [
    createHandlerApolloServer(options),
    createSchema,
    apolloHandler,
    {
        type: "before-handler",
        name: "before-handler-setup-headless-plugins",
        async handle({ args, context }) {
            const [event] = args;
            const { key } = event.pathParameters;
            const [type, environment = "default"] = key.split("/");
            context.plugins.register(await headlessPlugins({ type, environment }));
        }
    }
];
