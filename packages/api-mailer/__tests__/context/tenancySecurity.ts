import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import {
    SecurityIdentity,
    SecurityPermission,
    SecurityStorageOperations
} from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { createPermissions } from "./helpers";
import { MailerContext } from "~/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { TenancyStorageOperations } from "@webiny/api-tenancy/types";

interface Config {
    permissions: SecurityPermission[];
    identity?: SecurityIdentity | null;
}

export const createTenancyAndSecurity = ({ permissions, identity }: Config) => {
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");

    return [
        createTenancyContext({
            storageOperations: tenancyStorage.storageOperations
        }),
        createTenancyGraphQL(),
        createSecurityContext({
            storageOperations: securityStorage.storageOperations
        }),
        createSecurityGraphQL(),
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
