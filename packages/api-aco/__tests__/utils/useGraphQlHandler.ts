import { createApiCore } from "@webiny/api-core";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createHandler } from "@webiny/handler-aws";
import createGraphQLHandler from "@webiny/handler-graphql";
import type { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { until } from "@webiny/project-utils/testing/helpers/until";

import {
    CREATE_RECORD,
    DELETE_RECORD,
    GET_RECORD,
    LIST_RECORDS,
    LIST_TAGS,
    MOVE_RECORD,
    UPDATE_RECORD
} from "~tests/graphql/record.gql";

import {
    CREATE_CONTENT_MODEL,
    CREATE_CONTENT_MODEL_GROUP,
    CREATE_ENTRY,
    DELETE_ENTRY,
    GET_ENTRY,
    LIST_ENTRIES,
    UPDATE_ENTRY
} from "~tests/graphql/cms";

import { createAco } from "~/index";
import { createIdentity } from "./identity";
import { getIntrospectionQuery } from "graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import type { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import type { CmsModel, HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { createFileManagerContext, createFileManagerGraphQL } from "@webiny/api-file-manager";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createAcoSdk } from "~tests/utils/createAcoSdk.js";

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
    body: {
        query: string;
        variables?: Record<string, any>;
    };
    headers?: Record<string, string>;
}

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const documentClient = getDocumentClient();
    const { permissions, identity, plugins = [] } = params;

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
            ...createTenancyAndSecurity({
                permissions,
                identity: identity === undefined ? createIdentity() : identity
            }),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            createFileManagerContext(),
            createFileManagerGraphQL(),
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
            {} as unknown as LambdaContext
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const invokeCms = async ({
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

    const search = {
        async createRecord(variables = {}) {
            return invoke({ body: { query: CREATE_RECORD, variables } });
        },
        async updateRecord(variables = {}) {
            return invoke({ body: { query: UPDATE_RECORD, variables } });
        },
        async moveRecord(variables = {}) {
            return invoke({ body: { query: MOVE_RECORD, variables } });
        },
        async deleteRecord(variables = {}) {
            return invoke({ body: { query: DELETE_RECORD, variables } });
        },
        async listRecords(variables = {}) {
            return invoke({ body: { query: LIST_RECORDS, variables } });
        },
        async getRecord(variables = {}) {
            return invoke({ body: { query: GET_RECORD, variables } });
        },
        async listTags(variables = {}) {
            return invoke({ body: { query: LIST_TAGS, variables } });
        }
    };

    const cms = {
        // Models, model groups, entries.
        async createContentModel(variables: Record<string, any>) {
            return invokeCms({ body: { query: CREATE_CONTENT_MODEL, variables } });
        },

        async createContentModelGroup(variables: Record<string, any>) {
            return invokeCms({ body: { query: CREATE_CONTENT_MODEL_GROUP, variables } });
        },

        async createTestModelGroup() {
            return cms
                .createContentModelGroup({
                    data: {
                        name: "Group",
                        slug: "group",
                        icon: "ico/ico",
                        description: "description"
                    }
                })
                .then(([response]) => {
                    return response.data.createContentModelGroup.data;
                });
        },

        async createBasicModel(variables: Record<string, any>) {
            return cms
                .createContentModel({
                    data: {
                        modelId: "basicTestModel",
                        group: variables.modelGroup,
                        defaultFields: true,
                        name: "BasicTestModel",
                        singularApiName: "BasicTestModel",
                        pluralApiName: "BasicTestModels"
                    }
                })
                .then(([response]) => {
                    return response.data.createContentModel.data as CmsModel;
                });
        },

        async createEntry(model: CmsModel, variables: Record<string, any>) {
            return invokeCms({ body: { query: CREATE_ENTRY(model), variables } });
        },

        async updateEntry(model: CmsModel, variables: Record<string, any>) {
            return invokeCms({ body: { query: UPDATE_ENTRY(model), variables } });
        },

        async deleteEntry(model: CmsModel, variables: Record<string, any>) {
            return invokeCms({ body: { query: DELETE_ENTRY(model), variables } });
        },

        async listEntries(model: CmsModel, variables: Record<string, any> = {}) {
            return invokeCms({ body: { query: LIST_ENTRIES(model), variables } });
        },

        async getEntry(model: CmsModel, variables: Record<string, any>) {
            return invokeCms({ body: { query: GET_ENTRY(model), variables } });
        }
    };

    const aco = createAcoSdk(invoke);

    return {
        until,
        params,
        handler,
        invoke,
        aco,
        search,
        cms,
        async introspect() {
            return invoke({
                body: {
                    query: getIntrospectionQuery()
                }
            });
        }
    };
};
