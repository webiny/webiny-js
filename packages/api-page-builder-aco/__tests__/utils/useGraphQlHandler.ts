import createGraphQLHandler from "@webiny/handler-graphql";
import { createI18NContext } from "@webiny/api-i18n";
import { CmsParametersPlugin, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { createHandler } from "@webiny/handler-aws/gateway";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity";

import {
    CREATE_PAGE,
    DELETE_PAGE,
    PUBLISH_PAGE,
    UNPUBLISH_PAGE,
    UPDATE_PAGE
} from "~tests/graphql/page.gql";
import { CREATE_CATEGORY } from "~tests/graphql/categories.gql";

import { GET_RECORD, LIST_RECORDS } from "~tests/graphql/record.gql";

import { createAcoPageBuilderContext } from "~/index";
import {
    createPageBuilderContext,
    createPageBuilderGraphQL
} from "@webiny/api-page-builder/graphql";
import { createAco } from "@webiny/api-aco";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { PageBuilderStorageOperations } from "@webiny/api-page-builder/types";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
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

const defaultIdentity: SecurityIdentity = {
    id: "12345678",
    type: "admin",
    displayName: "John Doe"
};

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    const i18nStorage = getStorageOps<any[]>("i18n");
    const pageBuilderStorage = getStorageOps<PageBuilderStorageOperations>("pageBuilder");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const handler = createHandler({
        plugins: [
            ...cmsStorage.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
            createI18NContext(),
            ...i18nStorage.storageOperations,
            mockLocalesPlugins(),
            new CmsParametersPlugin(async () => {
                return {
                    locale: "en-US",
                    type: "manage"
                };
            }),
            createHeadlessCmsContext({ storageOperations: cmsStorage.storageOperations }),
            createPageBuilderContext({ storageOperations: pageBuilderStorage.storageOperations }),
            createPageBuilderGraphQL(),
            createAco(),
            createAcoPageBuilderContext(),
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

    const pageBuilder = {
        // Pages
        async createPage(variables = {}) {
            return invoke({ body: { query: CREATE_PAGE, variables } });
        },
        async updatePage(variables = {}) {
            return invoke({ body: { query: UPDATE_PAGE, variables } });
        },
        async publishPage(variables = {}) {
            return invoke({ body: { query: PUBLISH_PAGE, variables } });
        },
        async unpublishPage(variables = {}) {
            return invoke({ body: { query: UNPUBLISH_PAGE, variables } });
        },
        async deletePage(variables = {}) {
            return invoke({ body: { query: DELETE_PAGE, variables } });
        },

        // Categories
        async createCategory(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CATEGORY, variables } });
        }
    };

    const search = {
        async getRecord(variables = {}) {
            return invoke({ body: { query: GET_RECORD, variables } });
        },
        async listRecords(variables = {}) {
            return invoke({ body: { query: LIST_RECORDS, variables } });
        }
    };

    return {
        params,
        handler,
        invoke,
        pageBuilder,
        search
    };
};
