import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import {
    SecurityContext,
    SecurityIdentity,
    SecurityPermission,
    SecurityStorageOperations
} from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { TenancyContext, TenancyStorageOperations, Tenant } from "@webiny/api-tenancy/types";

interface Config {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity | null;
}

export const defaultIdentity = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export const createTenancyAndSecurity = ({ permissions, identity }: Config = {}) => {
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
        new ContextPlugin<SecurityContext & TenancyContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root"
            } as Tenant);

            context.security.addAuthenticator(async () => {
                // `undefined` results in the default identity being set; `null` means "anonymous request".
                return identity === undefined ? defaultIdentity : identity;
            });

            context.security.addAuthorizer(async () => {
                return typeof permissions === "undefined" ? [{ name: "*" }] : permissions;
            });
        }),
        new BeforeHandlerPlugin<SecurityContext>(context => {
            return context.security.authenticate("");
        })
    ];
};
