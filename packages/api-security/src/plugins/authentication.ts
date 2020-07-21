import { SecurityAuthenticationPlugin, SecurityAuthorizationPlugin } from "../types";
import { ContextPlugin } from "@webiny/graphql/types";
import { SecurityIdentity } from "@webiny/api-security/utils";

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
                if (identity instanceof SecurityIdentity) {
                    context.security.identity = identity;
                    return;
                }
            }
        }
    } as ContextPlugin,
    // We want to provide the default "authorization" plugin, which just checks scopes in the "SecurityIdentity" instance.
    // Feel free to create your own if needed, but this one will probably suffice for a lot of cases.
    {
        type: "authorization",
        name: "authorization-identity-scopes",
        hasScope: ({ context, scope }) => {
            return context.security.getIdentity() && context.security.getIdentity().hasScope(scope);
        }
    } as SecurityAuthorizationPlugin
];
