import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { createPermissions } from "./helpers";
import type { MailerContext } from "~/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { SecurityPermission, SecurityStorageOperations } from "@webiny/api-core/types/security";
import { IdentityData } from "@webiny/api-core/features/IdentityContext";
import { TenancyStorageOperations } from "@webiny/api-core/types/tenancy";
import { createApiCore } from "@webiny/api-core";
import type { AdminUsersStorageOperations } from "@webiny/api-core/types/users.js";

interface Config {
    permissions: SecurityPermission[];
    identity?: IdentityData | null;
}

export const createTenancyAndSecurity = ({ permissions, identity }: Config) => {
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const usersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");

    return [
        createApiCore({
            tenancyStorageOperations: tenancyStorage.storageOperations,
            securityStorageOperations: securityStorage.storageOperations,
            usersStorageOperations: usersStorage.storageOperations
        }),
        new ContextPlugin<MailerContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                parent: null,
                description: "",
                status: "unknown",
                settings: {
                    domains: []
                },
                isInstalled: true,
                tags: [],
                webinyVersion: context.WEBINY_VERSION,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString()
            });

            context.security.addAuthenticator(async () => {
                const base = identity || {
                    id: "12345678",
                    type: "admin",
                    displayName: "John Doe"
                };
                return {
                    ...base,
                    permissions: createPermissions().concat({ name: "pb.*" })
                };
            });

            context.security.addAuthorizer(async () => {
                const { headers = {} } = context.request || {};
                if (headers["authorization"]) {
                    return null;
                }

                return permissions || [{ name: "*" }];
            });
        }),
        new BeforeHandlerPlugin<MailerContext>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean);
};
