import minimatch from "minimatch";
import { ContextPlugin } from "@webiny/graphql/types";
import { SecurityIdentity } from "./SecurityIdentity";
import { SecurityAuthenticationPlugin, SecurityAuthorizationPlugin } from "../types";

export default () => [
    {
        type: "context",
        name: "context-security",
        async apply(context) {
            if (!context.security) {
                context.security = {};
            }

            Object.assign(context.security, {
                identity: null,
                getIdentity() {
                    return context.security.identity;
                },
                async getPermission(permission) {
                    const perms = await context.security.getPermissions();
                    const exactMatch = perms.find(p => p.name === permission);
                    if (exactMatch) {
                        return exactMatch;
                    }

                    // Try matching using patterns
                    if (perms.find(p => minimatch(permission, p.name))) {
                        return { name: permission };
                    }

                    return null;
                },
                async getPermissions() {
                    const authorizationPlugin = context.plugins
                        .byType<SecurityAuthorizationPlugin>("security-authorization")
                        .pop();

                    return await authorizationPlugin.getPermissions(context);
                }
            });

            const authenticationPlugins = context.plugins.byType<SecurityAuthenticationPlugin>(
                "security-authentication"
            );

            for (let i = 0; i < authenticationPlugins.length; i++) {
                const identity = await authenticationPlugins[i].authenticate(context);
                if (identity instanceof SecurityIdentity) {
                    context.security.identity = identity;
                    return;
                }
            }
        }
    } as ContextPlugin
];
