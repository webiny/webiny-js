import type { Plugin, PluginCollection } from "@webiny/plugins/types.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import {
    createBackgroundTaskContext,
    createBackgroundTaskGraphQL
} from "@webiny/background-tasks/api";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import { createMockTaskServicePlugin } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { PermissionsArg } from "./helpers.js";
import { createPermissions } from "./helpers.js";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { loadWcpLicense } from "@webiny/api-core/features/wcp/loadWcpLicense.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins.js";
import { TenancyAndSecurityFeature } from "./TenancyAndSecurityFeature.js";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import type { Container } from "@webiny/di";

export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: IdentityData;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    bottomPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    path?: `manage/${string}-${string}}` | `read/${string}-${string}}` | string;
    testProjectLicense?: DecryptedWcpProjectLicense;
}

process.env.S3_BUCKET = "my-mock-s3-bucket";

export const createHandlerCore = (params: CreateHandlerCoreParams = {}) => {
    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const { permissions, identity, plugins = [], topPlugins = [], bottomPlugins = [] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = params.testProjectLicense || createTestWcpLicense();

    const setup = async (container: Container, extraPlugins: any[] = []): Promise<void> => {
        const wcpLicense = await loadWcpLicense(testProjectLicense);
        ApiCoreFeature.register(container, { ...apiCoreStorage.storageOperations, wcpLicense });

        // Registration order determines contextual-schema execution order:
        // 1. ApiCore.build() — registers WcpFeature
        // 2. TenancyAndSecurity.build() — seeds tenants, authenticates identity
        // 3. cmsStorage.plugins enhancer — ctx.db (runs in the enhance phase, before all build() calls)
        // 4. HeadlessCms.build() — sets up ctx.cms
        TenancyAndSecurityFeature.register(container, {
            permissions: createPermissions(permissions),
            identity
        });

        const extraCmsPlugins: any[] = [];

        // RegisterExtensionPlugin instances are pre-registered before HeadlessCms build() runs,
        // so private models reach the DI container before AcoContextEnhancer populates ModelCache.
        // Static plugins (CmsModelPlugin, GraphQLSchemaPlugin, etc.) are collected for ctx.plugins.
        // ContextPlugin instances (e.g. dbPlugins() for ctx.db) run in the enhance phase.
        processLegacyPlugins(container, cmsStorage.plugins);
        registerLegacyPluginsViaGqlContextualSchema(container, cmsStorage.plugins);
        for (const p of [cmsStorage.plugins].flat(Infinity as 1)) {
            if (p && typeof (p as any).apply !== "function" && typeof p !== "function") {
                extraCmsPlugins.push(p);
            }
        }

        if (extraPlugins.length > 0) {
            processLegacyPlugins(container, extraPlugins);
            for (const p of [extraPlugins].flat(Infinity as 1)) {
                if (p && typeof (p as any).apply !== "function" && typeof p !== "function") {
                    extraCmsPlugins.push(p);
                }
            }
        }

        HeadlessCmsFeature.register(container, { type: "manage", extraPlugins: extraCmsPlugins });
    };

    const legacyPlugins = [
        topPlugins,
        createBackgroundTaskContext(),
        ...createBackgroundTaskGraphQL(),
        plugins,
        createMockTaskServicePlugin(),
        bottomPlugins
    ];

    return {
        tenant,
        setup,
        legacyPlugins
    };
};
