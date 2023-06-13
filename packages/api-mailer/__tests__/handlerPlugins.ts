import createGraphQLHandlerPlugins from "@webiny/handler-graphql";
import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import { createI18NContext } from "@webiny/api-i18n";
import { CmsParametersPlugin, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { SecurityIdentity } from "@webiny/api-security/types";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createMailerContext, createMailerGraphQL } from "~/index";
import { createTenancyAndSecurity } from "./context/tenancySecurity";
import { createPermissions, PermissionsArg } from "./context/helpers";
import { contextSecurity } from "./graphQLHandler";

export interface CreateHandlerParams {
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}

export const createHandlerPlugins = (params?: CreateHandlerParams) => {
    const tenant = {
        id: "root",
        name: "Root",
        parent: null
    };
    const { permissions, identity, plugins = [] } = params || {};

    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");

    return [
        ...cmsStorage.plugins,
        createGraphQLHandlerPlugins(),
        ...createTenancyAndSecurity({
            permissions: [...createPermissions(permissions)],
            identity
        }),
        contextSecurity({ tenant, identity }),
        apiKeyAuthentication({ identityType: "api-key" }),
        apiKeyAuthorization({ identityType: "api-key" }),
        createI18NContext(),
        ...i18nStorage.storageOperations,
        /**
         * for the page builder we must define the current locale and type
         * we can do that via the CmsParametersPlugin
         */
        new CmsParametersPlugin(async context => {
            const locale = context.i18n.getContentLocale()?.code || "en-US";
            return {
                type: "read",
                locale
            };
        }),
        mockLocalesPlugins(),
        /**
         * We're using ddb-only storageOperations here because current jest setup doesn't allow
         * usage of more than one storageOperations at a time with the help of --keyword flag.
         */
        createHeadlessCmsContext({
            storageOperations: cmsStorage.storageOperations
        }),
        ...createMailerContext(),
        ...createMailerGraphQL(),
        plugins
    ];
};
