import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createHandler } from "@webiny/handler-aws";
import createGraphQLHandler from "@webiny/handler-graphql";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { until } from "@webiny/project-utils/testing/helpers/until";
import { getIntrospectionQuery } from "graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createIdentity, createPermissions } from "~tests/context/helpers";
import { createBackgroundTaskContext, createBackgroundTaskGraphQL } from "@webiny/tasks";
import { createHcmsBulkActions } from "~/index";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import graphQLHandlerPlugins from "@webiny/handler-graphql";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";

export interface UseGQLHandlerParams {
    identity?: IdentityData;
    permissions?: SecurityPermission[];
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: any[];
    testProjectLicense?: DecryptedWcpProjectLicense;
}

interface InvokeParams {
    httpMethod?: "POST";
    type?: string;
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { plugins = [] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const handler = createHandler({
        plugins: [
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations
            }),
            ...cmsStorage.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({
                permissions: createPermissions(),
                identity: createIdentity()
            }),
            createHeadlessCmsContext(),
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
        body,
        headers = {},
        ...rest
    }: InvokeParams) => {
        const response = await handler(
            {
                path: `/cms/${type}`,
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
