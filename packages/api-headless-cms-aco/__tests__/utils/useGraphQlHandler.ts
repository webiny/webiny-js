import createGraphQLHandler from "@webiny/handler-graphql";
import { createI18NContext } from "@webiny/api-i18n";
import {
    CmsParametersPlugin,
    createHeadlessCmsContext,
    createHeadlessCmsGraphQL
} from "@webiny/api-headless-cms";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { createHandler } from "@webiny/handler-aws";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createAcoHcmsContext } from "~/index";
import { createAco } from "@webiny/api-aco";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { CmsModel, HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { getIntrospectionQuery } from "graphql";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import createAdminUsersApp from "@webiny/api-admin-users";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import { createWcpContext } from "@webiny/api-wcp";
import { AdminUsersStorageOperations } from "@webiny/api-admin-users/types";
import { until } from "@webiny/project-utils/testing/helpers/until";
import {
    CREATE_CONTENT_MODEL,
    CREATE_CONTENT_MODEL_GROUP,
    CREATE_ENTRY,
    DELETE_ENTRY,
    GET_ENTRY,
    RESTORE_ENTRY
} from "~tests/graphql/cms.gql";

import { CREATE_FOLDER, DELETE_FOLDER } from "~tests/graphql/folder.gql";

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

const defaultIdentity: SecurityIdentity = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");
    const adminUsersStorage = getStorageOps<AdminUsersStorageOperations>("adminUsers");

    const testProjectLicense = params.testProjectLicense || createTestWcpLicense();

    const handler = createHandler({
        plugins: [
            ...cmsStorage.plugins,
            createWcpContext({ testProjectLicense }),
            createGraphQLHandler(),
            ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
            createI18NContext(),
            ...i18nStorage.storageOperations,
            mockLocalesPlugins(),
            createAdminUsersApp({
                storageOperations: adminUsersStorage.storageOperations
            }),
            new CmsParametersPlugin(async () => {
                return {
                    locale: "en-US",
                    type: "manage"
                };
            }),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            createAco(),
            createAcoHcmsContext(),
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

    const invokeCms = async ({
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

    const aco = {
        async createFolder(variables = {}) {
            return invoke({ body: { query: CREATE_FOLDER, variables } });
        },

        async deleteFolder(variables = {}) {
            return invoke({ body: { query: DELETE_FOLDER, variables } });
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

        async deleteEntry(model: CmsModel, variables: Record<string, any>) {
            return invokeCms({ body: { query: DELETE_ENTRY(model), variables } });
        },

        async restoreEntry(model: CmsModel, variables: Record<string, any>) {
            return invokeCms({ body: { query: RESTORE_ENTRY(model), variables } });
        },

        async getEntry(model: CmsModel, variables: Record<string, any>) {
            return invokeCms({ body: { query: GET_ENTRY(model), variables } });
        }
    };

    return {
        until,
        params,
        handler,
        invoke,
        aco,
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
