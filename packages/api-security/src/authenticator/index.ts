import minimatch from "minimatch";
import { ContextPluginInterface } from "@webiny/handler/types";
import { SecurityIdentity } from "./SecurityIdentity";
import {
    SecurityAuthenticationPlugin,
    SecurityAuthorizationPlugin,
    SecurityContext,
    SecurityPermission
} from "../types";

export default (): ContextPluginInterface<SecurityContext>[] => [
    {
        type: "context",
        name: "context-security",
        async apply(context) {
            if (!context.security) {
                context.security = {} as any;
            }

            Object.assign(context.security, {
                identity: null,
                getIdentity() {
                    return (context.security as any).identity;
                },
                async getPermission(permission): Promise<SecurityPermission | null> {
                    const perms = await context.security.getPermissions();
                    const exactMatch = perms.find(p => p.name === permission);
                    if (exactMatch) {
                        return exactMatch;
                    }

                    // Try matching using patterns
                    const matchedPermission = perms.find(p => minimatch(permission, p.name));
                    if (matchedPermission) {
                        return matchedPermission;
                    }

                    return null;
                },
                async getPermissions(): Promise<SecurityPermission[]> {
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
                },
                async hasFullAccess(): Promise<boolean> {
                    const permissions = (await context.security.getPermissions()) as SecurityPermission[];

                    return permissions.some(permission => {
                        return permission.name === "*";
                    });
                }
            });

            const authenticationPlugins = context.plugins.byType<SecurityAuthenticationPlugin>(
                "security-authentication"
            );

            for (let i = 0; i < authenticationPlugins.length; i++) {
                const identity = await authenticationPlugins[i].authenticate(context);
                if (identity instanceof SecurityIdentity) {
                    (context.security as any).identity = identity;
                    return;
                }
            }
        }
    }
];
