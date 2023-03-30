import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { createHandler } from "@webiny/handler-aws/gateway";
import createGraphQLHandler from "@webiny/handler-graphql";
import { Plugin, PluginCollection } from "@webiny/plugins/types";

import { createTenancyAndSecurity } from "./tenancySecurity";

import {
    CREATE_PAGE,
    DELETE_PAGE,
    UPDATE_PAGE,
    PUBLISH_PAGE,
    UNPUBLISH_PAGE
} from "~tests/graphql/page.gql";
import { CREATE_CATEGORY } from "~tests/graphql/categories.gql";

import { GET_RECORD } from "~tests/graphql/record.gql";

import { createAcoPageBuilderContext } from "~/index";
import { createStorageOperations } from "~tests/utils/storageOperations";
import {
    createPageBuilderContext,
    createPageBuilderGraphQL
} from "@webiny/api-page-builder/graphql";
import { createStorageOperations as createPageBuilderStorageOperations } from "@webiny/api-page-builder-so-ddb";
import { createACO } from "@webiny/api-aco";

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

const documentClient = new DocumentClient({
    convertEmptyValues: true,
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    sslEnabled: false,
    region: "local",
    accessKeyId: "test",
    secretAccessKey: "test"
});

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { permissions, identity, plugins = [], storageOperationPlugins } = params;

    const ops = createStorageOperations({
        plugins: storageOperationPlugins || []
    });

    const handler = createHandler({
        plugins: [
            ...ops.plugins,
            createGraphQLHandler(),
            ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: createHeadlessCmsStorageOperations({
                    documentClient
                })
            }),
            createHeadlessCmsGraphQL(),
            createPageBuilderContext({
                storageOperations: createPageBuilderStorageOperations({
                    documentClient
                })
            }),
            createPageBuilderGraphQL(),
            createACO(),
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
