import { ContextPlugin } from "@webiny/graphql/types";
import { SecurityIdentity } from "@webiny/api-security";
import { SecurityPlugin } from "@webiny/api-security/types";

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

            const securityPlugins = context.plugins.byType<SecurityPlugin>("authentication");

            for (let i = 0; i < securityPlugins.length; i++) {
                const identity = await securityPlugins[i].authenticate(context);
                if (identity instanceof SecurityIdentity) {
                    context.security.identity = identity;
                    return;
                }
            }
        }
    } as ContextPlugin
];
