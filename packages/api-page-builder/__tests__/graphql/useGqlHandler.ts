import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import { createPageBuilderContext, createPageBuilderGraphQL } from "~/graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import fileManagerPlugins from "@webiny/api-file-manager/plugins";
import fileManagerDdbPlugins from "@webiny/api-file-manager-ddb";
import prerenderingServicePlugins from "@webiny/api-prerendering-service/client";

import prerenderingHookPlugins from "~/prerendering/hooks";

import { INSTALL, IS_INSTALLED } from "./graphql/install";
import {
    CREATE_MENU,
    DELETE_MENU,
    LIST_MENUS,
    UPDATE_MENU,
    GET_MENU,
    GET_PUBLIC_MENU
} from "./graphql/menus";
import {
    CREATE_PAGE_ELEMENT,
    DELETE_PAGE_ELEMENT,
    LIST_PAGE_ELEMENTS,
    UPDATE_PAGE_ELEMENT,
    GET_PAGE_ELEMENT
} from "./graphql/pageElements";
import {
    CREATE_PAGE,
    DELETE_PAGE,
    LIST_PAGES,
    LIST_PUBLISHED_PAGES,
    LIST_PAGE_TAGS,
    UPDATE_PAGE,
    GET_PAGE,
    GET_PUBLISHED_PAGE,
    PUBLISH_PAGE,
    UNPUBLISH_PAGE,
    REQUEST_REVIEW,
    REQUEST_CHANGES,
    OEMBED_DATA
} from "./graphql/pages";

import { SecurityIdentity } from "@webiny/api-security/types";
import {
    CREATE_CATEGORY,
    DELETE_CATEGORY,
    LIST_CATEGORIES,
    UPDATE_CATEGORY,
    GET_CATEGORY
} from "./graphql/categories";

import { GET_SETTINGS, GET_DEFAULT_SETTINGS, UPDATE_SETTINGS } from "./graphql/settings";
import path from "path";
import fs from "fs";
import { until } from "@webiny/project-utils/testing/helpers/until";
import { createTenancyAndSecurity } from "../tenancySecurity";
import { getStorageOperations } from "../storageOperations";

interface Params {
    permissions?: any;
    identity?: SecurityIdentity;
    plugins?: any[];
    storageOperationPlugins?: any[];
}

export default ({ permissions, identity, plugins, storageOperationPlugins }: Params = {}) => {
    const ops = getStorageOperations({
        plugins: storageOperationPlugins || []
    });

    const handler = createHandler(
        ...ops.plugins,
        // TODO figure out a way to load these automatically
        fileManagerDdbPlugins(),
        graphqlHandler(),
        ...createTenancyAndSecurity({ permissions, identity }),
        i18nContext(),
        i18nDynamoDbStorageOperations(),
        fileManagerPlugins(),
        mockLocalesPlugins(),
        createPageBuilderGraphQL(),
        createPageBuilderContext({
            storageOperations: ops.storageOperations
        }),
        prerenderingHookPlugins(),
        prerenderingServicePlugins({
            handlers: {
                render: "render",
                flush: "flush",
                queue: {
                    add: "add",
                    process: "process"
                }
            }
        }),
        {
            type: "api-file-manager-storage",
            name: "api-file-manager-storage",
            async upload(args: any) {
                // TODO: use tmp OS directory
                const key = path.join(__dirname, args.name);

                fs.writeFileSync(key, args.buffer);

                return {
                    file: {
                        key: args.name,
                        name: args.name,
                        type: args.type,
                        size: args.size
                    }
                };
            },
            async delete() {
                return;
            }
        },
        plugins || []
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body = {}, headers = {}, ...rest }) => {
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
        handler,
        invoke,
        // Helpers.
        until,
        // GraphQL queries and mutations.
        // Install.
        async install(variables: any = { insertDemoData: false, name: "Test" }) {
            return invoke({
                body: {
                    query: INSTALL,
                    variables
                }
            });
        },

        async isInstalled(variables = {}) {
            return invoke({ body: { query: IS_INSTALLED, variables } });
        },

        // Menus.
        async createMenu(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_MENU, variables } });
        },
        async updateMenu(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_MENU, variables } });
        },
        async deleteMenu(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_MENU, variables } });
        },
        async listMenus(variables = {}) {
            return invoke({ body: { query: LIST_MENUS, variables } });
        },
        async getMenu(variables: Record<string, any>) {
            return invoke({ body: { query: GET_MENU, variables } });
        },
        async getPublicMenu(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PUBLIC_MENU, variables } });
        },

        // Categories.
        async createCategory(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CATEGORY, variables } });
        },
        async updateCategory(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_CATEGORY, variables } });
        },
        async deleteCategory(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_CATEGORY, variables } });
        },
        async listCategories(variables = {}) {
            return invoke({ body: { query: LIST_CATEGORIES, variables } });
        },
        async getCategory(variables: Record<string, any>) {
            return invoke({ body: { query: GET_CATEGORY, variables } });
        },

        // Pages.
        async createPage(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_PAGE, variables } });
        },
        async updatePage(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_PAGE, variables } });
        },
        async publishPage(variables: Record<string, any>) {
            return invoke({ body: { query: PUBLISH_PAGE, variables } });
        },
        async unpublishPage(variables: Record<string, any>) {
            return invoke({ body: { query: UNPUBLISH_PAGE, variables } });
        },
        async requestReview(variables: Record<string, any>) {
            return invoke({ body: { query: REQUEST_REVIEW, variables } });
        },
        async requestChanges(variables: Record<string, any>) {
            return invoke({ body: { query: REQUEST_CHANGES, variables } });
        },
        async deletePage(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_PAGE, variables } });
        },
        async listPages(variables: Record<string, any>) {
            return invoke({ body: { query: LIST_PAGES, variables } });
        },
        async listPublishedPages(variables = {}) {
            return invoke({ body: { query: LIST_PUBLISHED_PAGES, variables } });
        },
        async listPageTags(variables: Record<string, any>) {
            return invoke({ body: { query: LIST_PAGE_TAGS, variables } });
        },
        async getPage(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PAGE, variables } });
        },
        async getPublishedPage(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PUBLISHED_PAGE, variables } });
        },
        async oEmbedData(variables: Record<string, any>) {
            return invoke({ body: { query: OEMBED_DATA, variables } });
        },
        // PageElements.
        async createPageElement(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_PAGE_ELEMENT, variables } });
        },
        async updatePageElement(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_PAGE_ELEMENT, variables } });
        },
        async deletePageElement(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_PAGE_ELEMENT, variables } });
        },
        async listPageElements(variables: any = {}) {
            return invoke({ body: { query: LIST_PAGE_ELEMENTS, variables } });
        },
        async getPageElement(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PAGE_ELEMENT, variables } });
        },

        // PageBuilder Settings.
        async updateSettings(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_SETTINGS, variables } });
        },
        async getSettings(variables = {}) {
            return invoke({ body: { query: GET_SETTINGS, variables } });
        },
        async getDefaultSettings(variables = {}) {
            return invoke({ body: { query: GET_DEFAULT_SETTINGS, variables } });
        }
    };
};
