import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "~/index";
import { createTenancyAndSecurity } from "~tests/testHelpers/tenancySecurity";
import type { PermissionsArg } from "~tests/testHelpers/helpers";
import { createPermissions } from "~tests/testHelpers/helpers";
import type { ContextPlugin } from "@webiny/api";
import type { TestContext } from "~tests/testHelpers/types";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { enableBenchmarkOnEnvironmentVariable } from "./enableBenchmarkOnEnvironmentVariable";
import type { HeadlessCmsStorageOperations } from "~/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { IdentityData } from "@webiny/api-core/features/IdentityContext";
import { createApiCore } from "@webiny/api-core";
import type { TenancyStorageOperations } from "@webiny/api-core/types/tenancy.js";
import type { ApiKey, SecurityStorageOperations } from "@webiny/api-core/types/security.js";
import type { AdminUsersStorageOperations } from "@webiny/api-core/types/users.js";
import apiKeyAuthentication from "@webiny/api-core/legacy/security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-core/legacy/security/plugins/apiKeyAuthorization.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";

export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: IdentityData;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    bottomPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path?: `manage/${string}-${string}` | `read/${string}-${string}` | string;
}
export const createHandlerCore = (params: CreateHandlerCoreParams) => {
    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const {
        permissions,
        identity,
        plugins = [],
        topPlugins = [],
        bottomPlugins = [],
        setupTenancyAndSecurityGraphQL
    } = params;

    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = createTestWcpLicense();

    return {
        storageOperations: cmsStorage.storageOperations,
        tenant,
        plugins: [
            enableBenchmarkOnEnvironmentVariable(),
            topPlugins,
            createApiCore({
                tenancyStorageOperations: tenancyStorage.storageOperations,
                securityStorageOperations: securityStorage.storageOperations,
                usersStorageOperations: adminUsersStorage.storageOperations,
                testProjectLicense
            }),
            ...cmsStorage.plugins,
            ...createTenancyAndSecurity({
                setupGraphQL: setupTenancyAndSecurityGraphQL,
                permissions: createPermissions(permissions),
                identity
            }),
            {
                type: "context",
                name: "context-security-tenant",
                async apply(context) {
                    context.security.getApiKeyByToken = async (
                        token: string
                    ): Promise<ApiKey | null> => {
                        if (!token || token !== "aToken") {
                            return null;
                        }
                        const apiKey = "a1234567890";
                        return {
                            id: apiKey,
                            name: apiKey,
                            tenant: tenant.id,
                            permissions: identity?.permissions || [],
                            token,
                            createdBy: {
                                id: "test",
                                displayName: "test",
                                type: "admin"
                            },
                            description: "test",
                            createdOn: new Date().toISOString(),
                            webinyVersion: context.WEBINY_VERSION
                        };
                    };
                }
            } as ContextPlugin<TestContext>,
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            plugins,
            graphQLHandlerPlugins(),
            bottomPlugins
        ]
    };
};
