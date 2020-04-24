import { GraphQLContextPlugin } from "@webiny/graphql/types";
import authenticate from "./authentication/authenticate";
import { SecurityPlugin } from "@webiny/api-security/types";

const middlewarePlugin = (options): GraphQLContextPlugin => ({
    type: "graphql-context",
    name: "graphql-context-security",
    preApply: async context => {
        if (!context.event) {
            return;
        }

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
    middlewarePlugin(options),
    { type: "graphql-security", name: "graphql-security", authenticate }
];
