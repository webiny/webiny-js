import graphqlHandlerPlugins from "@webiny/handler-graphql";
import { createTenancyAndSecurity } from "~tests/utils/tenancySecurity";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
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
import { FileManagerStorageOperations } from "~/types";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { PluginCollection } from "@webiny/plugins/types";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";

export interface HandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity | null;
    plugins?: PluginCollection;
}

export const handlerPlugins = (params: HandlerParams) => {
    const { permissions, identity, plugins = [] } = params;
    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");

    return [
        ...cmsStorage.plugins,
        ...fileManagerStorage.plugins,
        createWcpContext(),
        createWcpGraphQL(),
        ...i18nStorage.storageOperations,
        graphqlHandlerPlugins(),
        ...createTenancyAndSecurity({ permissions, identity }),
        i18nContext(),
        mockLocalesPlugins(),
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
            // eslint-disable-next-line
            upload: async () => {},
            // eslint-disable-next-line
            delete: async () => {}
        }),
        /**
         * Make sure we dont have undefined plugins value.
         */
        ...(plugins || [])
    ];
};
