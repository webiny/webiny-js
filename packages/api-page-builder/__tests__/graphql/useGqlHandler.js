import { createHandler } from "@webiny/handler-aws";
import graphqlHandler from "@webiny/handler-graphql";
import pageBuilderPlugins from "@webiny/api-page-builder/graphql";
import tenancyPlugins from "@webiny/api-tenancy";
import securityPlugins from "@webiny/api-security";
import dbPlugins from "@webiny/handler-db";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import i18nContentPlugins from "@webiny/api-i18n-content/plugins";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import elasticsearchClientContextPlugin from "@webiny/api-elasticsearch";
import { simulateStream } from "@webiny/project-utils/testing/dynamodb";
import dynamoToElastic from "@webiny/api-dynamodb-to-elasticsearch/handler";
import { Client } from "@elastic/elasticsearch";
import fileManagerPlugins from "@webiny/api-file-manager/plugins";
import fileManagerDdbEsPlugins from "@webiny/api-file-manager-ddb-es";
import prerenderingServicePlugins from "@webiny/api-prerendering-service/client";

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
import { Db } from "@webiny/db";
import path from "path";
import fs from "fs";

const defaultTenant = { id: "root", name: "Root", parent: null };

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9200";

export default ({ permissions, identity, tenant } = {}) => {
    const logsDb = new Db({
        logTable: "PageBuilderLogs",
        driver: new DynamoDbDriver({
            documentClient: new DocumentClient({
                convertEmptyValues: true,
                endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
                sslEnabled: false,
                region: "local"
            })
        })
    });

    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
        sslEnabled: false,
        region: "local"
    });

    const elasticsearchContext = elasticsearchClientContextPlugin({
        endpoint: `http://localhost:${ELASTICSEARCH_PORT}`
    });

    // Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
    simulateStream(documentClient, createHandler(elasticsearchContext, dynamoToElastic()));

    const db = new Db({
        table: "PageBuilder",
        driver: new DynamoDbDriver({ documentClient })
    });

    const handler = createHandler(
        dbPlugins({
            table: "PageBuilder",
            logTable: "PageBuilderLogs",
            driver: new DynamoDbDriver({ documentClient })
        }),
        // TODO figure out a way to load these automatically
        fileManagerDdbEsPlugins(),
        elasticsearchContext,
        graphqlHandler(),
        tenancyPlugins(),
        securityPlugins(),
        {
            type: "context",
            apply(context) {
                context.tenancy.getCurrentTenant = () => {
                    return tenant || defaultTenant;
                };
            }
        },
        i18nContext(),
        i18nDynamoDbStorageOperations(),
        i18nContentPlugins(),
        fileManagerPlugins(),
        mockLocalesPlugins(),
        pageBuilderPlugins(),
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
                    displayName: "m"
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
            // eslint-disable-next-line
            async delete(args) {}
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

    const sleep = (ms = 333) => {
        return new Promise(resolve => {
            setTimeout(() => resolve(), ms);
        });
    };

    const elasticsearchClient = new Client({
        hosts: [`http://localhost:${ELASTICSEARCH_PORT}`],
        node: `http://localhost:${ELASTICSEARCH_PORT}`
    });

    return {
        handler,
        invoke,
        // Helpers.
        db,
        defaults: {
            db: {
                keys: [
                    {
                        primary: true,
                        unique: true,
                        name: "primary",
                        fields: [{ name: "PK" }, { name: "SK" }]
                    }
                ]
            }
        },
        elasticsearchClient,
        logsDb,
        createElasticSearchIndex: async () => {
            try {
                const tenantId = tenant ? tenant.id : defaultTenant.id;
                await elasticsearchClient.indices.create({ index: tenantId + "-page-builder" });
            } catch {}
        },
        deleteElasticSearchIndex: async () => {
            try {
                const tenantId = tenant ? tenant.id : defaultTenant.id;
                await sleep();
                await elasticsearchClient.indices.delete({ index: tenantId + "-page-builder" });
            } catch {}
        },
        sleep,
        until: async (execute, until, options = {}) => {
            const tries = options.tries ?? 10;
            const wait = options.wait ?? 333;

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
                await new Promise(resolve => {
                    setTimeout(() => resolve(), wait);
                });
            }

            throw new Error(
                `Tried ${tries} times but failed. Last result that was received: ${JSON.stringify(
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

        async isInstalled(variables) {
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
        async listMenus(variables) {
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
        async listCategories(variables) {
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
        async listPublishedPages(variables) {
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
        async listPageElements(variables) {
            return invoke({ body: { query: LIST_PAGE_ELEMENTS, variables } });
        },
        async getPageElement(variables) {
            return invoke({ body: { query: GET_PAGE_ELEMENT, variables } });
        },
        async updateSettings(variables) {
            return invoke({ body: { query: UPDATE_SETTINGS, variables } });
        },
        async getSettings(variables) {
            return invoke({ body: { query: GET_SETTINGS, variables } });
        },
        async getDefaultSettings(variables) {
            return invoke({ body: { query: GET_DEFAULT_SETTINGS, variables } });
        }
    };
};
