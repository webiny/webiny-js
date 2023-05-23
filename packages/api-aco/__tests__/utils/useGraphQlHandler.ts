import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createI18NContext } from "@webiny/api-i18n";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { createHandler } from "@webiny/handler-aws/gateway";
import createGraphQLHandler from "@webiny/handler-graphql";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
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
    UPDATE_RECORD
} from "~tests/graphql/record.gql";

import { createAco } from "~/index";
import { createIdentity } from "./identity";
import { getIntrospectionQuery } from "graphql";
import { GET_APP_MODEL } from "~tests/graphql/app.gql";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity | null;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: any[];
}

interface InvokeParams {
    httpMethod?: "POST";
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

    const handler = createHandler({
        plugins: [
            ...cmsStorage.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({
                permissions,
                identity: identity === undefined ? createIdentity() : identity
            }),
            createI18NContext(),
            ...i18nStorage.storageOperations,
            mockLocalesPlugins(),
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
            } as any,
            {} as any
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
        }
    };

    const search = {
        async createRecord(variables = {}) {
            return invoke({ body: { query: CREATE_RECORD, variables } });
        },
        async updateRecord(variables = {}) {
            return invoke({ body: { query: UPDATE_RECORD, variables } });
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

    return {
        params,
        handler,
        invoke,
        aco,
        search,
        async introspect() {
            return invoke({
                body: {
                    query: getIntrospectionQuery()
                }
            });
        }
    };
};
