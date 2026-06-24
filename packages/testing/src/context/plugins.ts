import { createContextPlugin } from "@webiny/api";
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
import type { ApiKey } from "@webiny/api-core/types/security.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createTenancyAndSecurity } from "./tenancySecurity.js";
import type { PermissionsArg } from "./helpers.js";
import { createPermissions } from "./helpers.js";
import { ApiCoreFeature } from "@webiny/api-core";
import { HeadlessCmsFeature } from "@webiny/api-headless-cms";
import { loadWcpLicense } from "@webiny/api-core/legacy/wcp/context.js";
import { processLegacyPlugins } from "./bridgeLegacyPlugins.js";
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

    const testProjectLicense = params.testProjectLicense || createTestWcpLicense();

    const setup = async (container: Container, extraPlugins: any[] = []): Promise<void> => {
        const wcpLicense = await loadWcpLicense(testProjectLicense);
        ApiCoreFeature.register(container, { ...apiCoreStorage.storageOperations, wcpLicense });
        processLegacyPlugins(container, cmsStorage.plugins);
        if (extraPlugins.length > 0) {
            processLegacyPlugins(container, extraPlugins);
        }
        HeadlessCmsFeature.register(container, { type: "manage" });
    };

    const legacyPlugins = [
        topPlugins,
        ...createTenancyAndSecurity({
            setupGraphQL: setupTenancyAndSecurityGraphQL,
            permissions: createPermissions(permissions),
            identity
        }),
        createContextPlugin(context => {
            // @ts-expect-error We're moving away from context object!
            context.security.getApiKeyByToken = async (token: string): Promise<ApiKey | null> => {
                if (!token || token !== "aToken") {
                    return null;
                }
                const apiKey = "a1234567890";
                return {
                    id: apiKey,
                    name: apiKey,
                    slug: apiKey,
                    permissions: identity?.permissions || [],
                    token,
                    createdBy: {
                        id: "test",
                        displayName: "test",
                        type: "admin"
                    },
                    description: "test",
                    createdOn: new Date().toISOString()
                };
            };
        }),
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
