import {
    GraphQLContextPlugin,
    GraphQLMiddlewarePlugin,
    GraphQLSchemaPlugin
} from "@webiny/api/types";
import { shield } from "graphql-shield";
import authenticate from "./authentication/authenticate";
import { SecurityPlugin } from "@webiny/api-security/types";

const shieldMiddleware: GraphQLMiddlewarePlugin = {
    type: "graphql-middleware",
    name: "graphql-middleware-shield",
    middleware({ plugins }) {
        const middleware = [];
        plugins.byType<GraphQLSchemaPlugin>("graphql-schema").forEach(plugin => {
            let { security } = plugin;
            if (!security) {
                return true;
            }

            if (typeof security === "function") {
                security = security();
            }

            security.shield &&
                middleware.push(
                    shield(security.shield, {
                        allowExternalErrors: true
                    })
                );
        });

        return middleware;
    }
} as GraphQLMiddlewarePlugin;

const middlewarePlugin = (options): GraphQLContextPlugin => ({
    type: "graphql-context",
    name: "graphql-context-security",
    preApply: async context => {
        context.security = options;
        context.token = null;
        context.user = null;
        context.getUser = () => context.user;

        const securityPlugins = context.plugins.byType<SecurityPlugin>("graphql-security");
        for (let i = 0; i < securityPlugins.length; i++) {
            await securityPlugins[i].authenticate(context);
        }
    }
});

export default options => [
    shieldMiddleware,
    middlewarePlugin(options),
    { type: "graphql-security", name: "graphql-security", authenticate }
];
