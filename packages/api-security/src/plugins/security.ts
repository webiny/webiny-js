import authenticateJwt from "./authentication/authenticateJwt";
import authenticatePat from "./authentication/authenticatePat";
import { SecurityOptions, SecurityPlugin } from "../types";
import { ContextPlugin } from "@webiny/graphql/types";
import authorizationPlugins from "./authorization";

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

            const securityPlugins = context.plugins.byType<SecurityPlugin>("authentication");
            for (let i = 0; i < securityPlugins.length; i++) {
                await securityPlugins[i].authenticate(context);
            }

            if (options.public === false && !context.token) {
                throw Error("Not authenticated!");
            }
        }
    } as ContextPlugin,
    {
        type: "authentication",
        name: "authentication-jwt",
        authenticate: authenticateJwt
    } as SecurityPlugin,
    {
        type: "authentication",
        name: "authentication-pat",
        authenticate: authenticatePat(options)
    } as SecurityPlugin,
    authorizationPlugins
];
