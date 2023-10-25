import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createI18NContext } from "@webiny/api-i18n";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { createHandler } from "@webiny/handler-aws/gateway";
import createGraphQLHandler from "@webiny/handler-graphql";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { createAco } from "~/index";
import { createIdentity } from "./identity";
import { getIntrospectionQuery } from "graphql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { CmsModel, HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import createAdminUsersApp from "@webiny/api-admin-users";
import { createWcpContext } from "@webiny/api-wcp";
import { createTestWcpLicense } from "~tests/utils/createTestWcpLicense";
import { AdminUsersStorageOperations } from "@webiny/api-admin-users/types";
import {
    CREATE_CONTENT_MODEL,
    CREATE_CONTENT_MODEL_GROUP,
    CREATE_ENTRY,
    GET_ENTRY,
    LIST_ENTRIES,
    UPDATE_ENTRY,
    DELETE_ENTRY
} from "~tests/graphql/cms";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity | null;
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

export const useCmsGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
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
            ...createTenancyAndSecurity({
                permissions,
                identity: identity === undefined ? createIdentity() : identity
            }),
            createI18NContext(),
            ...i18nStorage.storageOperations,
            mockLocalesPlugins(),
            createAdminUsersApp({
                storageOperations: adminUsersStorage.storageOperations
            }),
            createHeadlessCmsContext({
                storageOperations: cmsStorage.storageOperations
            }),
            createHeadlessCmsGraphQL(),
            createAco(),
            plugins
        ],
        http: {
            debug: false
        }
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
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
            } as any,
            {} as any
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const returnHandler = {
        params,
        handler,
        invoke,

        // Models, model groups, entries.
        async createContentModel(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CONTENT_MODEL, variables } });
        },
        async createContentModelGroup(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CONTENT_MODEL_GROUP, variables } });
        },
        async createTestModelGroup() {
            return returnHandler
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
            return returnHandler
                .createContentModel({
                    data: {
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
            return invoke({ body: { query: CREATE_ENTRY(model), variables } });
        },

        async updateEntry(model: CmsModel, variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_ENTRY(model), variables } });
        },

        async deleteEntry(model: CmsModel, variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_ENTRY(model), variables } });
        },

        async listEntries(model: CmsModel, variables: Record<string, any> = {}) {
            return invoke({ body: { query: LIST_ENTRIES(model), variables } });
        },

        async getEntry(model: CmsModel, variables: Record<string, any>) {
            return invoke({ body: { query: GET_ENTRY(model), variables } });
        },

        async introspect() {
            return invoke({
                body: {
                    query: getIntrospectionQuery()
                }
            });
        }
    };

    return returnHandler;
};
