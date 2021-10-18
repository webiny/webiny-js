import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import pageBuilderPlugins from "../../src/graphql";
import securityPlugins from "@webiny/api-security";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";

import fileManagerPlugins from "@webiny/api-file-manager/plugins";
import fileManagerDdbEsPlugins from "@webiny/api-file-manager-ddb-es";
import prerenderingServicePlugins from "@webiny/api-prerendering-service/client";

import prerenderingHookPlugins from "../../src/prerendering/hooks";

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

import { SecurityIdentity } from "@webiny/api-security";
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
import { Tenant } from "@webiny/api-tenancy/types";
import { UntilOptions } from "@webiny/project-utils/testing/helpers/until";

const defaultTenant = { id: "root", name: "Root", parent: null };

interface Params {
    permissions?: any;
    identity?: SecurityIdentity;
    tenant?: Tenant;
    plugins?: any[];
}

export default ({ permissions, identity, tenant, plugins }: Params = {}) => {
    // @ts-ignore
    if (typeof __getStorageOperationsPlugins !== "function") {
        throw new Error(`There is no global "__getStorageOperationsPlugins" function.`);
    }
    // @ts-ignore
    const storageOperations = __getStorageOperationsPlugins();
    if (typeof storageOperations !== "function") {
        throw new Error(
            `A product of "__getStorageOperationsPlugins" must be a function to initialize storage operations.`
        );
    }

    const handler = createHandler(
        storageOperations(),
        // TODO figure out a way to load these automatically
        fileManagerDdbEsPlugins(),
        graphqlHandler(),
        {
            type: "context",
            apply: context => {
                if (context.tenancy) {
                    return;
                }
                context.tenancy = {
                    getRootTenant: () => defaultTenant,
                    getTenantById: (id: string) => {
                        return {
                            id,
                            name: id.toUpperCase(),
                            parent: null
                        };
                    },
                    getCurrentTenant: () => {
                        return tenant || defaultTenant;
                    }
                };
            }
        },
        securityPlugins(),
        i18nContext(),
        i18nDynamoDbStorageOperations(),
        i18nContentPlugins(),
        fileManagerPlugins(),
        mockLocalesPlugins(),
        pageBuilderPlugins(),
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
                    displayName: "m",
                    type: "a"
                })
        },
        {
            type: "api-file-manager-storage",
            name: "api-file-manager-storage",
            async upload(args) {
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

    const sleep = (ms = 333) => {
        return new Promise(resolve => {
            setTimeout(() => resolve(undefined), ms);
        });
    };

    return {
        handler,
        invoke,
        // Helpers.
        sleep,
        until: async (execute, until, options: UntilOptions = {}) => {
            const { name = "NO_NAME", tries = 5, wait = 300 } = options;

            let result;
            let triesCount = 0;

            while (true) {
                result = await execute();

                let done;
                try {
                    done = await until(result);
                } catch {}

                if (done) {
                    return result;
                }

                triesCount++;
                if (triesCount === tries) {
                    break;
                }

                // Wait.
                await new Promise((resolve: any) => {
                    setTimeout(() => resolve(), wait);
                });
            }

            throw new Error(
                `[${name}] Tried ${tries} times but failed. Last result that was received: ${JSON.stringify(
                    result,
                    null,
                    2
                )}`
            );
        },

        // GraphQL queries and mutations.
        // Install.
        async install(variables) {
            return invoke({ body: { query: INSTALL, variables } });
        },

        async isInstalled(variables = {}) {
            return invoke({ body: { query: IS_INSTALLED, variables } });
        },

        // Menus.
        async createMenu(variables) {
            return invoke({ body: { query: CREATE_MENU, variables } });
        },
        async updateMenu(variables) {
            return invoke({ body: { query: UPDATE_MENU, variables } });
        },
        async deleteMenu(variables) {
            return invoke({ body: { query: DELETE_MENU, variables } });
        },
        async listMenus(variables = {}) {
            return invoke({ body: { query: LIST_MENUS, variables } });
        },
        async getMenu(variables) {
            return invoke({ body: { query: GET_MENU, variables } });
        },
        async getPublicMenu(variables) {
            return invoke({ body: { query: GET_PUBLIC_MENU, variables } });
        },

        // Categories.
        async createCategory(variables) {
            return invoke({ body: { query: CREATE_CATEGORY, variables } });
        },
        async updateCategory(variables) {
            return invoke({ body: { query: UPDATE_CATEGORY, variables } });
        },
        async deleteCategory(variables) {
            return invoke({ body: { query: DELETE_CATEGORY, variables } });
        },
        async listCategories(variables = {}) {
            return invoke({ body: { query: LIST_CATEGORIES, variables } });
        },
        async getCategory(variables) {
            return invoke({ body: { query: GET_CATEGORY, variables } });
        },

        // Pages.
        async createPage(variables) {
            return invoke({ body: { query: CREATE_PAGE, variables } });
        },
        async updatePage(variables) {
            return invoke({ body: { query: UPDATE_PAGE, variables } });
        },
        async publishPage(variables) {
            return invoke({ body: { query: PUBLISH_PAGE, variables } });
        },
        async unpublishPage(variables) {
            return invoke({ body: { query: UNPUBLISH_PAGE, variables } });
        },
        async requestReview(variables) {
            return invoke({ body: { query: REQUEST_REVIEW, variables } });
        },
        async requestChanges(variables) {
            return invoke({ body: { query: REQUEST_CHANGES, variables } });
        },
        async deletePage(variables) {
            return invoke({ body: { query: DELETE_PAGE, variables } });
        },
        async listPages(variables) {
            return invoke({ body: { query: LIST_PAGES, variables } });
        },
        async listPublishedPages(variables = {}) {
            return invoke({ body: { query: LIST_PUBLISHED_PAGES, variables } });
        },
        async listPageTags(variables) {
            return invoke({ body: { query: LIST_PAGE_TAGS, variables } });
        },
        async getPage(variables) {
            return invoke({ body: { query: GET_PAGE, variables } });
        },
        async getPublishedPage(variables) {
            return invoke({ body: { query: GET_PUBLISHED_PAGE, variables } });
        },
        async oEmbedData(variables) {
            return invoke({ body: { query: OEMBED_DATA, variables } });
        },
        // PageElements.
        async createPageElement(variables) {
            return invoke({ body: { query: CREATE_PAGE_ELEMENT, variables } });
        },
        async updatePageElement(variables) {
            return invoke({ body: { query: UPDATE_PAGE_ELEMENT, variables } });
        },
        async deletePageElement(variables) {
            return invoke({ body: { query: DELETE_PAGE_ELEMENT, variables } });
        },
        async listPageElements(variables: any = {}) {
            return invoke({ body: { query: LIST_PAGE_ELEMENTS, variables } });
        },
        async getPageElement(variables) {
            return invoke({ body: { query: GET_PAGE_ELEMENT, variables } });
        },

        // PageBuilder Settings.
        async updateSettings(variables) {
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
