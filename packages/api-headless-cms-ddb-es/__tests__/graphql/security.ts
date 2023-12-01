import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import { ContextPlugin } from "@webiny/api";
import { createTenancyContext } from "@webiny/api-tenancy";
import { TenancyStorageOperations, Tenant } from "@webiny/api-tenancy/types";
import { createSecurityContext } from "@webiny/api-security";
import { SecurityStorageOperations } from "@webiny/api-security/types";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { CmsContext } from "~/types";

export const createSecurity = () => {
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");

    return [
        createTenancyContext({
            storageOperations: tenancyStorage.storageOperations
        }),
        createSecurityContext({
            storageOperations: securityStorage.storageOperations
        }),
        new ContextPlugin<CmsContext>(context => {
            context.tenancy.setCurrentTenant({
                id: "root",
                name: "Root",
                webinyVersion: context.WEBINY_VERSION
            } as Tenant);

            context.security.addAuthenticator(async () => {
                return {
                    id: "id-12345678",
                    type: "admin",
                    displayName: "John Doe"
                };
            });

            context.security.addAuthorizer(async () => {
                const { headers = {} } = context.request || {};
                if (headers["authorization"]) {
                    return null;
                }

                return [{ name: "*" }];
            });
        }),
        new BeforeHandlerPlugin<CmsContext>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        }),
        apiKeyAuthentication({ identityType: "api-key" }),
        apiKeyAuthorization({ identityType: "api-key" })
    ];
};
