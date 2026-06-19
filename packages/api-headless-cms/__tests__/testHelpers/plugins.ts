import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createCmsExtension } from "~/index";
import { createTenancyAndSecurity } from "~tests/testHelpers/tenancySecurity";
import type { PermissionsArg } from "~tests/testHelpers/helpers";
import { createPermissions } from "~tests/testHelpers/helpers";
import type { ContextPlugin } from "@webiny/api";
import type { TestContext } from "~tests/testHelpers/types";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { enableBenchmarkOnEnvironmentVariable } from "./enableBenchmarkOnEnvironmentVariable";
import type { HeadlessCmsStorageOperations } from "~/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createApiCore } from "@webiny/api-core";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { GetApiKeyByTokenUseCase } from "@webiny/api-core/features/security/apiKeys/GetApiKeyByToken/index.js";
import { Result } from "@webiny/feature/api/index.js";
import { ApiKeyNotFoundError } from "@webiny/api-core/features/security/apiKeys/shared/errors.js";

export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: IdentityData;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    bottomPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path?: `manage/${string}-${string}` | `read/${string}-${string}` | string;
}
export const createHandlerCore = (params: CreateHandlerCoreParams = {}) => {
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

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = createTestWcpLicense();

    return {
        storageOperations: cmsStorage.storageOperations,
        tenant,
        plugins: [
            enableBenchmarkOnEnvironmentVariable(),
            topPlugins,
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations,
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
                    context.container.registerInstance(GetApiKeyByTokenUseCase, {
                        execute: async (token: string) => {
                            if (!token || token !== "aToken") {
                                return Result.fail(new ApiKeyNotFoundError());
                            }
                            const apiKey = "a1234567890";
                            return Result.ok({
                                id: apiKey,
                                name: apiKey,
                                slug: tenant.id,
                                permissions: identity?.permissions || permissions || [],
                                token,
                                createdBy: {
                                    id: "test",
                                    displayName: "test",
                                    type: "admin"
                                },
                                description: "test",
                                createdOn: new Date().toISOString()
                            });
                        }
                    });
                }
            } as ContextPlugin<TestContext>,
            createCmsExtension(),
            plugins,
            graphQLHandlerPlugins(),
            bottomPlugins
        ]
    };
};
