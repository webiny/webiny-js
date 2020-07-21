import { SecurityAuthenticationPlugin } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/graphql/types";

export default (options: any) => [
    {
        type: "context",
        name: "context-security",
        apply: async context => {
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

            const securityPlugins = context.plugins.byType<SecurityAuthenticationPlugin>(
                "authentication"
            );

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
    } as ContextPlugin
];
