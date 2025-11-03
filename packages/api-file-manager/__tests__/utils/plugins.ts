import graphqlHandlerPlugins from "@webiny/handler-graphql";
import { createTenancyAndSecurity } from "~tests/utils/tenancySecurity";
import {
    CmsParametersPlugin,
    createHeadlessCmsContext,
    createHeadlessCmsGraphQL
} from "@webiny/api-headless-cms";
import {
    createFileManagerContext,
    createFileManagerGraphQL,
    FilePhysicalStoragePlugin
} from "~/index";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { FileManagerStorageOperations } from "~/types";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import type { PluginCollection } from "@webiny/plugins/types";
import type { TenancyStorageOperations } from "@webiny/api-core/types/tenancy.js";
import type {
    SecurityPermission,
    SecurityStorageOperations
} from "@webiny/api-core/types/security.js";
import type { AdminUsersStorageOperations } from "@webiny/api-core/types/users.js";
import { createApiCore } from "@webiny/api-core";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";

export interface HandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData | null;
    plugins?: PluginCollection;
}

export const handlerPlugins = (params: HandlerParams) => {
    const { permissions, identity, plugins = [] } = params;

    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");
    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = createTestWcpLicense();

    return [
        createApiCore({
            tenancyStorageOperations: tenancyStorage.storageOperations,
            securityStorageOperations: securityStorage.storageOperations,
            usersStorageOperations: adminUsersStorage.storageOperations,
            testProjectLicense
        }),
        ...cmsStorage.plugins,
        ...fileManagerStorage.plugins,
        graphqlHandlerPlugins(),
        ...createTenancyAndSecurity({ permissions, identity }),
        new CmsParametersPlugin(async () => {
            return {
                locale: "en-US",
                type: "manage"
            };
        }),
        createHeadlessCmsContext({ storageOperations: cmsStorage.storageOperations }),
        createHeadlessCmsGraphQL(),
        createFileManagerContext({
            storageOperations: fileManagerStorage.storageOperations
        }),
        createFileManagerGraphQL(),
        /**
         * Mock physical file storage plugin.
         */
        new FilePhysicalStoragePlugin({
            upload: async () => {},

            delete: async () => {}
        }),
        /**
         * Make sure we dont have undefined plugins value.
         */
        ...(plugins || [])
    ];
};
