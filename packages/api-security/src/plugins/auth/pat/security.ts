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

            context.security = {
                options,
                token: null,
                user: null
            };

            if (context.security.options.public === true) {
                return;
            }

            const securityPlugins = context.plugins.byType<SecurityPlugin>("authentication");

            // Some of these plugins will hopefully assign a user into the "context.security.user".
            // Once that happens, just break out of the loop.
            for (let i = 0; i < securityPlugins.length; i++) {
                await securityPlugins[i].authenticate(context);
                if (context.security.user) {
                    break;
                }
            }

            if (!context.security.user) {
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
