import createGraphQLHandler from "@webiny/handler-graphql";
import { CmsParametersPlugin, createCmsExtension } from "@webiny/api-headless-cms";
import { createHandler } from "@webiny/handler-aws";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createAco } from "@webiny/api-aco";
import { createAcoSdk } from "../../../api-aco/__tests__/utils/createAcoSdk.js";
import { getStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { getIntrospectionQuery } from "graphql";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import { createFileManagerSdk } from "../../../api-file-manager/__tests__/utils/createFileManagerSdk.js";
import { createFileManagerAco } from "~/index.js";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: IdentityData;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: any[];
    testProjectLicense?: DecryptedWcpProjectLicense;
}

interface InvokeParams {
    httpMethod?: "POST";
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

const defaultIdentity: IdentityData = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
    const apiAcoStorage = getStorageOps<ApiCoreStorageOperations>("aco");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const testProjectLicense = params.testProjectLicense || createTestWcpLicense();

    const handler = createHandler({
        plugins: [
            createApiCore({
                storageOperations: apiCoreStorage.storageOperations,
                testProjectLicense
            }),
            ...apiAcoStorage.plugins,
            ...cmsStorage.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
            new CmsParametersPlugin(async () => {
                return {
                    type: "manage"
                };
            }),
            createCmsExtension(),
            createAco(),
            createFileManagerContext(),
            createFileManagerGraphQL(),
            createFileManagerAco(),
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
            {} as LambdaContext
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const fm = createFileManagerSdk(invoke);
    const aco = createAcoSdk(invoke);

    return {
        params,
        handler,
        invoke,
        fm,
        aco,
        introspect: () => {
            return invoke({
                body: {
                    query: getIntrospectionQuery()
                }
            });
        }
    };
};
