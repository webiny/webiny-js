import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createI18NContext } from "@webiny/api-i18n";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { createHandler } from "@webiny/handler-aws";
import createGraphQLHandler from "@webiny/handler-graphql";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { until } from "@webiny/project-utils/testing/helpers/until";

import {
    CREATE_FOLDER,
    DELETE_FOLDER,
    GET_FOLDER,
    LIST_FOLDERS,
    UPDATE_FOLDER
} from "~tests/graphql/folder.gql";
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
    CREATE_FILTER,
    DELETE_FILTER,
    GET_FILTER,
    LIST_FILTERS,
    UPDATE_FILTER
} from "~tests/graphql/filter.gql";
import {
    CREATE_FILE,
    CREATE_FILES,
    DELETE_FILE,
    GET_FILE,
    LIST_FILES,
    LIST_TAGS as LIST_FILE_TAGS,
    UPDATE_FILE
} from "~tests/graphql/file";
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
import { GET_APP_MODEL } from "~tests/graphql/app.gql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";
import { CmsModel, HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import {
    createFileManagerContext,
    createFileManagerGraphQL,
    FilePhysicalStoragePlugin
} from "@webiny/api-file-manager";
import { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import createAdminUsersApp from "@webiny/api-admin-users";
import { createWcpContext } from "@webiny/api-wcp";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import { AdminUsersStorageOperations } from "@webiny/api-admin-users/types";

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

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");
    const i18nStorage = getStorageOps<any[]>("i18n");
    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");
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
            createFileManagerContext({
                storageOperations: fileManagerStorage.storageOperations
            }),
            createFileManagerGraphQL(),
            /**
             * Mock physical file storage plugin.
             */
            new FilePhysicalStoragePlugin({
                // eslint-disable-next-line
                upload: async () => {},
                // eslint-disable-next-line
                delete: async () => {}
            }),
            createHeadlessCmsGraphQL(),
            createAco(),
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
        async updateFolder(variables = {}) {
            return invoke({ body: { query: UPDATE_FOLDER, variables } });
        },
        async deleteFolder(variables = {}) {
            return invoke({ body: { query: DELETE_FOLDER, variables } });
        },
        async listFolders(variables = {}) {
            return invoke({ body: { query: LIST_FOLDERS, variables } });
        },
        async getFolder(variables = {}) {
            return invoke({ body: { query: GET_FOLDER, variables } });
        },
        async getAppModel(variables: { id: string }) {
            return invoke({ body: { query: GET_APP_MODEL, variables } });
        },
        async createFilter(variables = {}) {
            return invoke({ body: { query: CREATE_FILTER, variables } });
        },
        async updateFilter(variables = {}) {
            return invoke({ body: { query: UPDATE_FILTER, variables } });
        },
        async deleteFilter(variables = {}) {
            return invoke({ body: { query: DELETE_FILTER, variables } });
        },
        async listFilters(variables = {}) {
            return invoke({ body: { query: LIST_FILTERS, variables } });
        },
        async getFilter(variables = {}) {
            return invoke({ body: { query: GET_FILTER, variables } });
        }
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

    const fm = {
        // Files
        async createFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FILE(fields), variables } });
        },
        async updateFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: UPDATE_FILE(fields), variables } });
        },
        async createFiles(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: CREATE_FILES(fields), variables } });
        },
        async deleteFile(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_FILE, variables } });
        },
        async getFile(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: GET_FILE(fields), variables } });
        },
        async listFiles(variables = {}, fields: string[] = []) {
            return invoke({ body: { query: LIST_FILES(fields), variables } });
        },
        async listTags(variables = {}) {
            return invoke({ body: { query: LIST_FILE_TAGS, variables } });
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

    return {
        until,
        params,
        handler,
        invoke,
        aco,
        search,
        fm,
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
