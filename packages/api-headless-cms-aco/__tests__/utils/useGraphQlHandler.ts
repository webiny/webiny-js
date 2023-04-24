import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { createHandler } from "@webiny/handler-aws/gateway";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import createGraphQlPlugins from "@webiny/handler-graphql";

import { createTenancyAndSecurity } from "./tenancySecurity";

import {
    CREATE_ARTICLE,
    DELETE_ARTICLE,
    PUBLISH_ARTICLE,
    UNPUBLISH_ARTICLE,
    UPDATE_ARTICLE
} from "../graphql/article.gql";
import { GET_RECORD } from "../graphql/record.gql";

import { createCmsAcoContext } from "~/index";
import { createStorageOperations } from "./storageOperations";
import { createAco } from "@webiny/api-aco";
import { createContextPlugin } from "@webiny/handler";
import { CmsAcoContext } from "~/types";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
    storageOperationPlugins?: any[];
}

interface InvokeParams {
    httpMethod?: "POST";
    path?: "/graphql" | "/cms/manage/en-US";
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
    const { permissions, identity, plugins = [], storageOperationPlugins } = params;

    const ops = createStorageOperations({
        plugins: storageOperationPlugins || []
    });

    const handler = createHandler({
        plugins: [
            ...ops.plugins,
            ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: ops.storageOperations
            }),
            createGraphQlPlugins(),
            createHeadlessCmsGraphQL(),
            createAco(),
            createCmsAcoContext(),
            createContextPlugin<CmsAcoContext>(async context => {
                /**
                 * We are initializing the model because the Elasticsearch Storage Ops create a model index with this method.
                 * This also serves as the index cleanup as it registers the index when it's created.
                 */
                context.cms.onEntryBeforeCreate.subscribe(async ({ model }) => {
                    await context.cms.initializeModel(model.modelId, {});
                });
            }),
            plugins
        ],
        http: {
            debug: false
        }
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({
        httpMethod = "POST",
        path,
        body,
        headers = {},
        ...rest
    }: InvokeParams) => {
        const response = await handler(
            {
                path: path || "/cms/manage/en-US",
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

    const cms = {
        async createArticle(variables = {}) {
            return invoke({ body: { query: CREATE_ARTICLE(), variables } });
        },
        async updateArticle(variables = {}) {
            return invoke({ body: { query: UPDATE_ARTICLE(), variables } });
        },
        async publishArticle(variables = {}) {
            return invoke({ body: { query: PUBLISH_ARTICLE(), variables } });
        },
        async unpublishArticle(variables = {}) {
            return invoke({ body: { query: UNPUBLISH_ARTICLE(), variables } });
        },
        async deleteArticle(variables = {}) {
            return invoke({ body: { query: DELETE_ARTICLE(), variables } });
        }
    };

    const search = {
        async getRecord(variables = {}) {
            return invoke({ path: "/graphql", body: { query: GET_RECORD, variables } });
        }
    };

    return {
        params,
        handler,
        invoke,
        cms,
        search
    };
};
