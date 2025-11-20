import createGraphQLHandler from "@webiny/handler-graphql";
import {
    CmsParametersPlugin,
    createHeadlessCmsContext,
    createHeadlessCmsGraphQL
} from "@webiny/api-headless-cms";
import { createHandler } from "@webiny/handler-aws";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity";

import { CREATE_FOLDER, GET_FOLDER } from "~tests/graphql/folder.gql";

import { createAco } from "@webiny/api-aco";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { getIntrospectionQuery } from "graphql";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { createApiCore } from "@webiny/api-core";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";

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

    const documentClient = getDocumentClient();

    const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
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
            ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
            new CmsParametersPlugin(async () => {
                return {
                    type: "manage"
                };
            }),
            createHeadlessCmsContext({ storageOperations: cmsStorage.storageOperations }),
            createHeadlessCmsGraphQL(),
            createAco({ documentClient }),
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

    const folders = {
        async createFolder(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FOLDER(fields), variables } });
        },
        async getFolder(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: GET_FOLDER(fields), variables } });
        }
    };

    return {
        params,
        handler,
        invoke,
        introspect: () => {
            return invoke({
                body: {
                    query: getIntrospectionQuery()
                }
            });
        },
        folders
    };
};
