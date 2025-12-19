import { createApiCore } from "@webiny/api-core";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createHandler } from "@webiny/handler-aws";
import createGraphQLHandler from "@webiny/handler-graphql";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity.js";
import { until } from "@webiny/project-utils/testing/helpers/until";
import { createWebsiteBuilder } from "~/index.js";
import { createIdentity } from "./identity.js";
import { getIntrospectionQuery } from "graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { FileAliasStorageOperations } from "@webiny/api-file-manager/types.js";
import { createWbSdk } from "~tests/utils/createWbSdk.js";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData | null;
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
    const { permissions, identity, plugins = [] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const fileManagerStorage = getStorageOps<FileAliasStorageOperations>("fileManager");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = params.testProjectLicense || createTestWcpLicense();

    const handler = createHandler({
        plugins: [
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations,
                testProjectLicense
            }),
            ...cmsStorage.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({
                permissions,
                identity: identity === undefined ? createIdentity() : identity
            }),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            createFileManagerContext({
                fileAliasStorageOperations: fileManagerStorage.storageOperations
            }),
            createFileManagerGraphQL(),
            createWebsiteBuilder(),
            plugins
        ],
        debug: false
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }: InvokeParams) => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    ["Content-Type"]: "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            } as unknown as APIGatewayEvent,
            {} as unknown as LambdaContext
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const wb = createWbSdk(invoke);

    return {
        until,
        params,
        handler,
        invoke,
        wb,
        async introspect() {
            return invoke({
                body: {
                    query: getIntrospectionQuery()
                }
            });
        }
    };
};
