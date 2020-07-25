import { SecurityAuthenticationPlugin } from "../types";
import { ContextPlugin } from "@webiny/graphql/types";

export default () => [
    {
        type: "context",
        name: "context-security",
        apply: async context => {
            context.security = {
                identity: null,
                getIdentity() {
                    return context.security.identity;
                }
            };

            const securityPlugins = context.plugins.byType<SecurityAuthenticationPlugin>(
                "authentication"
            );

            for (let i = 0; i < securityPlugins.length; i++) {
                const identity = await securityPlugins[i].authenticate(context);
                if (identity) {
                    context.security.identity = identity;
                    return;
                }
            }
        }
    } as ContextPlugin
];
