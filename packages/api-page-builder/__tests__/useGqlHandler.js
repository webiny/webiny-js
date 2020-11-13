import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import pageBuilderPlugins from "@webiny/api-page-builder/plugins";
import securityPlugins from "@webiny/api-security/authenticator";
import dbPlugins from "@webiny/handler-db";
import i18nContext from "@webiny/api-i18n/plugins/context";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { mockLocalesPlugins } from "@webiny/api-i18n/testing";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { CREATE_MENU, DELETE_MENU, LIST_MENUS, UPDATE_MENU, GET_MENU } from "./graphql/menus";
import {
    CREATE_PAGE_ELEMENT,
    DELETE_PAGE_ELEMENT,
    LIST_PAGE_ELEMENTS,
    UPDATE_PAGE_ELEMENT,
    GET_PAGE_ELEMENT
} from "./graphql/pageElements";
import { CREATE_PAGE, DELETE_PAGE, LIST_PAGES, UPDATE_PAGE, GET_PAGE } from "./graphql/pages";
import { SecurityIdentity } from "@webiny/api-security";
import {
    CREATE_CATEGORY,
    DELETE_CATEGORY,
    LIST_CATEGORIES,
    UPDATE_CATEGORY,
    GET_CATEGORY
} from "./graphql/categories";
import elasticSearch from "@webiny/api-plugin-elastic-search-client";
import { Client } from "@elastic/elasticsearch";

export default ({ permissions, identity } = {}) => {
    const handler = createHandler(
        dbPlugins({
            table: "PageBuilder",
            driver: new DynamoDbDriver({
                documentClient: new DocumentClient({
                    convertEmptyValues: true,
                    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
                    sslEnabled: false,
                    region: "local"
                })
            })
        }),
        elasticSearch({ endpoint: `http://localhost:9201` }),
        apolloServerPlugins(),
        securityPlugins(),
        i18nContext,
        i18nContentPlugins(),
        mockLocalesPlugins(),
        pageBuilderPlugins(),

        {
            type: "security-authorization",
            name: "security-authorization",
            getPermissions: () => permissions || [{ name: "*" }]
        },
        {
            type: "security-authentication",
            authenticate: () =>
                identity ||
                new SecurityIdentity({
                    id: "mocked",
                    displayName: "m"
                })
        }
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    return {
        elasticSearch: new Client({
            hosts: [`http://localhost:9201`],
            node: "http://localhost:9201"
        }),
        sleep: (ms = 333) => {
            return new Promise(resolve => {
                setTimeout(resolve, ms);
            });
        },
        handler,
        invoke,
        // Menus
        async createMenu(variables) {
            return invoke({ body: { query: CREATE_MENU, variables } });
        },
        async updateMenu(variables) {
            return invoke({ body: { query: UPDATE_MENU, variables } });
        },
        async deleteMenu(variables) {
            return invoke({ body: { query: DELETE_MENU, variables } });
        },
        async listMenus(variables) {
            return invoke({ body: { query: LIST_MENUS, variables } });
        },
        async getMenu(variables) {
            return invoke({ body: { query: GET_MENU, variables } });
        },

        // Categories
        async createCategory(variables) {
            return invoke({ body: { query: CREATE_CATEGORY, variables } });
        },
        async updateCategory(variables) {
            return invoke({ body: { query: UPDATE_CATEGORY, variables } });
        },
        async deleteCategory(variables) {
            return invoke({ body: { query: DELETE_CATEGORY, variables } });
        },
        async listCategories(variables) {
            return invoke({ body: { query: LIST_CATEGORIES, variables } });
        },
        async getCategory(variables) {
            return invoke({ body: { query: GET_CATEGORY, variables } });
        },

        async createPage(variables) {
            return invoke({ body: { query: CREATE_PAGE, variables } });
        },
        async updatePage(variables) {
            return invoke({ body: { query: UPDATE_PAGE, variables } });
        },
        async deletePage(variables) {
            return invoke({ body: { query: DELETE_PAGE, variables } });
        },
        async listPages(variables) {
            return invoke({ body: { query: LIST_PAGES, variables } });
        },
        async getPage(variables) {
            return invoke({ body: { query: GET_PAGE, variables } });
        },

        // PageElements
        async createPageElement(variables) {
            return invoke({ body: { query: CREATE_PAGE_ELEMENT, variables } });
        },
        async updatePageElement(variables) {
            return invoke({ body: { query: UPDATE_PAGE_ELEMENT, variables } });
        },
        async deletePageElement(variables) {
            return invoke({ body: { query: DELETE_PAGE_ELEMENT, variables } });
        },
        async listPageElements(variables) {
            return invoke({ body: { query: LIST_PAGE_ELEMENTS, variables } });
        },
        async getPageElement(variables) {
            return invoke({ body: { query: GET_PAGE_ELEMENT, variables } });
        }
    };
};
