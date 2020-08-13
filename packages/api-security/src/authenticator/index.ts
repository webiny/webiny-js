import minimatch from "minimatch";
import { ContextPlugin } from "@webiny/graphql/types";
import { SecurityIdentity } from "./SecurityIdentity";
import { SecurityPlugin } from "../types";

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
                    const exactMatch = perms.find((p) => p.name === permission);
                    if (exactMatch) {
                        return exactMatch;
                    }

                    // Try matching using patterns
                    if (perms.find((p) => minimatch(permission, p.name))) {
                        return { name: permission };
                    }

                    return null;
                },
                async getPermissions() {
                    const identity = context.security.getIdentity();
                    if (!identity) {
                        return [];
                    }

                    if (typeof identity.getPermissions !== "function") {
                        throw Error(
                            [
                                "Security configuration is incomplete!",
                                `You must either override the "context.security.getPermissions" function, or provide a "getPermissions()" function for your SecurityIdentity instance.`
                            ].join("\n")
                        );
                    }

                    return await context.security.getIdentity().getPermissions();
                }
            });

            const securityPlugins = context.plugins.byType<SecurityPlugin>("security");

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
