import authenticateJwt from "./authentication/authenticateJwt";
import authenticatePat from "./authentication/authenticatePat";
import { SecurityPlugin } from "@webiny/api-security/types";
import { GraphQLContextPlugin } from "@webiny/graphql/types";

const contextPlugin = (options): GraphQLContextPlugin => ({
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
    contextPlugin(options),
    {
        type: "graphql-security",
        name: "graphql-security-jwt",
        authenticate: authenticateJwt
    } as SecurityPlugin,
    {
        type: "graphql-security",
        name: "graphql-security-pat",
        authenticate: authenticatePat(options)
    } as SecurityPlugin
];
