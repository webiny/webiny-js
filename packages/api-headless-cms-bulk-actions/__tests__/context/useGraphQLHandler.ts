import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createHandler } from "@webiny/handler-aws";
import createGraphQLHandler from "@webiny/handler-graphql";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { until } from "@webiny/project-utils/testing/helpers/until";
import { getIntrospectionQuery } from "graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createDummyLocales, createIdentity, createPermissions } from "~tests/context/helpers";
import { createBackgroundTaskContext, createBackgroundTaskGraphQL } from "@webiny/tasks";
import { createHcmsBulkActions } from "~/index";
import { createWcpContext } from "@webiny/api-wcp";
import { createI18NContext } from "@webiny/api-i18n";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import { AdminUsersStorageOperations } from "@webiny/api-admin-users/types";
import createAdminUsersApp from "@webiny/api-admin-users";
import graphQLHandlerPlugins from "@webiny/handler-graphql";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: any[];
    testProjectLicense?: DecryptedWcpProjectLicense;
}

interface InvokeParams {
    httpMethod?: "POST";
    type?: string;
    locale?: string;
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { plugins = [] } = params;

    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");

    const handler = createHandler({
        plugins: [
            createWcpContext(),
            ...cmsStorage.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({
                setupGraphQL: true,
                permissions: createPermissions(),
                identity: createIdentity()
            }),
            createI18NContext(),
            ...i18nStorage.storageOperations,
            createDummyLocales(),
            mockLocalesPlugins(),
            createAdminUsersApp({
                storageOperations: adminUsersStorage.storageOperations
            }),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            graphQLHandlerPlugins(),
            createBackgroundTaskContext(),
            createBackgroundTaskGraphQL(),
            createHcmsBulkActions(),
            plugins
        ],
        debug: true
    });

    const invoke = async ({
        httpMethod = "POST",
        type = "manage",
        locale = "en-US",
        body,
        headers = {},
        ...rest
    }: InvokeParams) => {
        const response = await handler(
            {
                path: `/cms/${type}/${locale}`,
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            {} as LambdaContext
        );
        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const introspect = async () => {
        return invoke({
            body: {
                query: getIntrospectionQuery()
            }
        });
    };

    return {
        params,
        until,
        handler,
        invoke,
        introspect
    };
};
