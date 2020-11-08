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
                    const authorizationPlugins = context.plugins.byType<
                        SecurityAuthorizationPlugin
                    >("security-authorization");

                    for (let i = 0; i < authorizationPlugins.length; i++) {
                        const result = await authorizationPlugins[i].getPermissions(context);
                        if (Array.isArray(result)) {
                            return result;
                        }
                    }

                    // Returning an empty array since not a single plugin returned any permissions.
                    return [];
                }
            });

            const authenticationPlugins = context.plugins.byType<SecurityAuthenticationPlugin>(
                "security-authentication"
            );

            for (let i = 0; i < authenticationPlugins.length; i++) {
                try {
                    const identity = await authenticationPlugins[i].authenticate(context);
                    if (identity instanceof SecurityIdentity) {
                        context.security.identity = identity;
                        return;
                    }
                } catch (e) {
                    // Authentication errors should not exposed to the client,
                    // and should be treated as an authentication failure
                    continue;
                }
            }
        }
    } as ContextPlugin
];
