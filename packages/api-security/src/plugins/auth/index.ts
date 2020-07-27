import { ContextPlugin } from "@webiny/graphql/types";
import {
    SecurityAuthenticationPlugin,
    SecurityAuthorizationPlugin
} from "@webiny/api-security/types";

export default () => [
    {
        type: "context",
        name: "context-security",
        apply: async context => {
            context.security = {
                identity: null,
                getIdentity() {
                    return context.security.identity;
                },
                async hasScope(scope) {
                    const scopeAuthorizationPlugins = context.plugins.byType<
                        SecurityAuthorizationPlugin
                    >("authorization");

                    for (const plugin of scopeAuthorizationPlugins) {
                        if (await plugin.hasScope({ context, scope })) {
                            return true;
                        }
                    }
                    return false;
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
