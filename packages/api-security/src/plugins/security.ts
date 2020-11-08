import authenticateJwt from "./authentication/authenticateJwt";
import authenticatePat from "./authentication/authenticatePat";
import { SecurityOptions, SecurityPlugin } from "../types";
import { ContextPlugin } from "@webiny/graphql/types";

export default (options: SecurityOptions) => [
    {
        type: "context",
        name: "context-security",
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
                try {
                    await securityPlugins[i].authenticate(context);
                } catch (e) {
                    // Authentication errors should not exposed to the client,
                    // and should be treated as an authentication failure
                    continue;
                }
            }

            if (options.public === false && !context.user) {
                throw Error("Not authenticated!");
            }
        }
    } as ContextPlugin,
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
