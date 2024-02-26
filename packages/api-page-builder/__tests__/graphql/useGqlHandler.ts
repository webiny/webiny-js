import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import { createPageBuilderContext, createPageBuilderGraphQL } from "~/graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createFileManagerContext } from "@webiny/api-file-manager";
import prerenderingServicePlugins from "@webiny/api-prerendering-service/client";
import prerenderingHookPlugins from "~/prerendering/hooks";

import { INSTALL, IS_INSTALLED } from "./graphql/install";
import {
    CREATE_MENU,
    DELETE_MENU,
    GET_MENU,
    GET_PUBLIC_MENU,
    LIST_MENUS,
    UPDATE_MENU
} from "./graphql/menus";
import {
    CREATE_PAGE_ELEMENT,
    DELETE_PAGE_ELEMENT,
    GET_PAGE_ELEMENT,
    LIST_PAGE_ELEMENTS,
    UPDATE_PAGE_ELEMENT
} from "./graphql/pageElements";
import {
    CREATE_PAGE,
    DELETE_PAGE,
    DUPLICATE_PAGE,
    GET_PAGE,
    GET_PUBLISHED_PAGE,
    LIST_PAGE_TAGS,
    LIST_PAGES,
    LIST_PUBLISHED_PAGES,
    OEMBED_DATA,
    PUBLISH_PAGE,
    UNLINK_PAGE_FROM_TEMPLATE,
    UNPUBLISH_PAGE,
    UPDATE_PAGE
} from "./graphql/pages";

import { SecurityIdentity } from "@webiny/api-security/types";
import {
    CREATE_CATEGORY,
    DELETE_CATEGORY,
    GET_CATEGORY,
    LIST_CATEGORIES,
    UPDATE_CATEGORY
} from "./graphql/categories";

import { GET_DEFAULT_SETTINGS, GET_SETTINGS, UPDATE_SETTINGS } from "./graphql/settings";

import {
    CREATE_BLOCK_CATEGORY,
    DELETE_BLOCK_CATEGORY,
    GET_BLOCK_CATEGORY,
    LIST_BLOCK_CATEGORIES,
    UPDATE_BLOCK_CATEGORY
} from "./graphql/blockCategories";

import {
    CREATE_PAGE_BLOCK,
    DELETE_PAGE_BLOCK,
    GET_PAGE_BLOCK,
    LIST_PAGE_BLOCKS,
    UPDATE_PAGE_BLOCK
} from "./graphql/pageBlocks";

import {
    CREATE_PAGE_FROM_TEMPLATE,
    CREATE_PAGE_TEMPLATE,
    DELETE_PAGE_TEMPLATE,
    GET_PAGE_TEMPLATE,
    LIST_PAGE_TEMPLATES,
    UPDATE_PAGE_TEMPLATE
} from "./graphql/pageTemplates";

import path from "path";
import fs from "fs";
import { until } from "@webiny/project-utils/testing/helpers/until";
import { createTenancyAndSecurity } from "../tenancySecurity";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { PageBuilderStorageOperations } from "~/types";
import { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types";
import { CmsParametersPlugin, createHeadlessCmsContext } from "@webiny/api-headless-cms";
import { LambdaContext } from "@webiny/handler-aws/types";

interface Params {
    permissions?: any;
    identity?: SecurityIdentity | null;
    plugins?: any[];
    storageOperationPlugins?: any[];
}

export default ({ permissions, identity, plugins }: Params = {}) => {
    const i18nStorage = getStorageOps<any>("i18n");
    const pageBuilderStorage = getStorageOps<PageBuilderStorageOperations>("pageBuilder");
    const fileManagerStorage = getStorageOps<FileManagerStorageOperations>("fileManager");
    const cmsStorage = getStorageOps<HeadlessCmsStorageOperations>("cms");

    const handler = createHandler({
        plugins: [
            ...cmsStorage.plugins,
            ...pageBuilderStorage.plugins,
            createWcpContext(),
            createWcpGraphQL(),
            graphqlHandler(),
            ...createTenancyAndSecurity({ permissions, identity }),
            i18nContext(),
            i18nStorage.storageOperations,
            mockLocalesPlugins(),
            createHeadlessCmsContext({ storageOperations: cmsStorage.storageOperations }),
            createFileManagerContext({ storageOperations: fileManagerStorage.storageOperations }),
            createPageBuilderGraphQL(),
            createPageBuilderContext({ storageOperations: pageBuilderStorage.storageOperations }),
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
            new CmsParametersPlugin(async context => {
                const locale = context.i18n.getCurrentLocale("content")?.code || "en-US";
                return {
                    type: "manage",
                    locale
                };
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
        ]
    });

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body = {}, headers = {}, ...rest }: any) => {
        const response = await handler(
            {
                path: "/graphql",
                httpMethod,
                headers: {
                    ["x-tenant"]: "root",
                    "Content-Type": "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                ...rest
            },
            {} as LambdaContext
        );

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
        async duplicatePage(variables: Record<string, any>) {
            return invoke({ body: { query: DUPLICATE_PAGE, variables } });
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
        async unlinkPageFromTemplate(variables: Record<string, any>) {
            return invoke({ body: { query: UNLINK_PAGE_FROM_TEMPLATE, variables } });
        },
        async deletePage(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_PAGE, variables } });
        },
        async listPages(variables: Record<string, any> = {}) {
            return invoke({ body: { query: LIST_PAGES, variables } });
        },
        async listPublishedPages(variables = {}) {
            return invoke({ body: { query: LIST_PUBLISHED_PAGES, variables } });
        },
        async listPageTags(variables: Record<string, any> = {}) {
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
        },

        // Block Categories.
        async createBlockCategory(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_BLOCK_CATEGORY, variables } });
        },
        async updateBlockCategory(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_BLOCK_CATEGORY, variables } });
        },
        async deleteBlockCategory(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_BLOCK_CATEGORY, variables } });
        },
        async listBlockCategories(variables = {}) {
            return invoke({ body: { query: LIST_BLOCK_CATEGORIES, variables } });
        },
        async getBlockCategory(variables: Record<string, any>) {
            return invoke({ body: { query: GET_BLOCK_CATEGORY, variables } });
        },

        // Page Blocks.
        async createPageBlock(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_PAGE_BLOCK, variables } });
        },
        async updatePageBlock(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_PAGE_BLOCK, variables } });
        },
        async deletePageBlock(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_PAGE_BLOCK, variables } });
        },
        async listPageBlocks(variables: any = {}) {
            return invoke({ body: { query: LIST_PAGE_BLOCKS, variables } });
        },
        async getPageBlock(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PAGE_BLOCK, variables } });
        },
        // Page Templates.
        async createPageTemplate(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_PAGE_TEMPLATE, variables } });
        },
        async updatePageTemplate(variables: Record<string, any>) {
            return invoke({ body: { query: UPDATE_PAGE_TEMPLATE, variables } });
        },
        async deletePageTemplate(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_PAGE_TEMPLATE, variables } });
        },
        async listPageTemplates(variables: any = {}) {
            return invoke({ body: { query: LIST_PAGE_TEMPLATES, variables } });
        },
        async getPageTemplate(variables: Record<string, any>) {
            return invoke({ body: { query: GET_PAGE_TEMPLATE, variables } });
        },
        async createPageFromTemplate(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_PAGE_FROM_TEMPLATE, variables } });
        }
    };
};
