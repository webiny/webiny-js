import createGraphQLHandlerPlugins from "@webiny/handler-graphql";
import { CmsParametersPlugin, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createMailerContext, createMailerGraphQL } from "~/index";
import { createTenancyAndSecurity } from "./context/tenancySecurity";
import type { PermissionsArg } from "./context/helpers";
import { createPermissions } from "./context/helpers";
import { contextSecurity } from "./graphQLHandler";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import apiKeyAuthentication from "@webiny/api-core/legacy/security/plugins/apiKeyAuthentication.js";
import apiKeyAuthorization from "@webiny/api-core/legacy/security/plugins/apiKeyAuthorization.js";

export interface CreateHandlerParams {
    permissions?: PermissionsArg[];
    identity?: IdentityData;
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
        /**
         * We're using ddb-only storageOperations here because current jest setup doesn't allow
         * usage of more than one storageOperations at a time with the help of --keyword flag.
         */
        new CmsParametersPlugin(async () => {
            return {
                type: "read"
            };
        }),
        createHeadlessCmsContext({
            storageOperations: cmsStorage.storageOperations
        }),
        createMailerContext(),
        createMailerGraphQL(),
        plugins
    ];
};
