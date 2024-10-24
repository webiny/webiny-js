import apiKeyAuthentication from "@webiny/api-security/plugins/apiKeyAuthentication";
import apiKeyAuthorization from "@webiny/api-security/plugins/apiKeyAuthorization";
import i18nContext from "@webiny/api-i18n/graphql/context";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createWcpContext } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { ApiKey, SecurityIdentity } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { Context } from "~/types";
import { createPermissions, PermissionsArg } from "./permissions";
import { createDummyLocales } from "./locales";
import { createRecordLocking } from "~/index";

export interface CreateHandlerCoreParams {
    setupTenancyAndSecurityGraphQL?: boolean;
    permissions?: PermissionsArg[];
    identity?: SecurityIdentity;
    topPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    bottomPlugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
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

    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");

    return {
        storageOperations: cmsStorage.storageOperations,
        tenant,
        plugins: [
            topPlugins,
            createWcpContext(),
            new ContextPlugin<Context>(async context => {
                const wcp = context.wcp;
                context.wcp.ensureCanUseFeature = featureId => {
                    if (featureId !== "recordLocking") {
                        return wcp.ensureCanUseFeature(featureId);
                    }
                    return true;
                };
                context.wcp.canUseRecordLocking = () => {
                    return true;
                };
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
            } as ContextPlugin<Context>,
            apiKeyAuthentication({ identityType: "api-key" }),
            apiKeyAuthorization({ identityType: "api-key" }),
            i18nContext(),
            i18nStorage.storageOperations,
            createDummyLocales(),
            mockLocalesPlugins(),
            graphQLHandlerPlugins(),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            createRecordLocking(),
            plugins,
            graphQLHandlerPlugins(),
            bottomPlugins
        ]
    };
};
