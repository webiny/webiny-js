import graphqlHandler from "@webiny/handler-graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import prerenderingServicePlugins from "@webiny/api-prerendering-service/client";
import prerenderingHookPlugins from "@webiny/api-page-builder/prerendering/hooks";
import dbPlugins from "@webiny/handler-db";
import { getIntrospectionQuery } from "graphql";
import { createHandler } from "@webiny/handler-aws/gateway";
import { createPageBuilderContext, createPageBuilderGraphQL } from "@webiny/api-page-builder";
import { createStorageOperations } from "~/index";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/client";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import { createFileManagerContext } from "@webiny/api-file-manager";
import { createFileManagerStorageOperations } from "@webiny/api-file-manager-ddb";
import {
    createPageCreateGraphQl,
    createPageGetGraphQl,
    createPageGetPublishedGraphQl,
    createPageListGraphQl,
    createPageUpdateGraphQl,
    DELETE_PAGE,
    PUBLISH_PAGE,
    UNPUBLISH_PAGE
} from "../../api-page-builder/__tests__/graphql/graphql/pages";
import { CREATE_CATEGORY } from "../../api-page-builder/__tests__/graphql/graphql/categories";
import { PluginCollection } from "@webiny/plugins/types";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { createHandler as createDynamoDBHandler } from "@webiny/handler-aws/dynamodb";
import { createEventHandler as createDynamoDBToElasticsearchHandler } from "@webiny/api-dynamodb-to-elasticsearch";
import elasticsearchClientContextPlugin, {
    createGzipCompression,
    getElasticsearchOperators
} from "@webiny/api-elasticsearch";
/**
 * File does not have types.
 */
// @ts-ignore
import { simulateStream } from "@webiny/project-utils/testing/dynamodb";
import { configurations } from "~/configurations";
import { createContextPlugin } from "@webiny/handler";
import { PbContext } from "@webiny/api-page-builder/graphql/types";

interface Params {
    plugins?: PluginCollection;
}

export const useHandler = (params: Params) => {
    const elasticsearch = createElasticsearchClient();
    const documentClient = new DocumentClient({
        convertEmptyValues: true,
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
        sslEnabled: false,
        region: "local",
        accessKeyId: "test",
        secretAccessKey: "test"
    });

    const storageOperations = createStorageOperations({
        elasticsearch,
        documentClient
    });

    const elasticsearchClientContext = elasticsearchClientContextPlugin(elasticsearch);

    const getIndexName = () => {
        const { index } = configurations.es({
            tenant: "root",
            locale: "en-US"
        });
        return index;
    };

    const refreshIndex = async (): Promise<void> => {
        const index = getIndexName();

        try {
            await elasticsearch.indices.refresh({ index });
        } catch (ex) {
            console.log(`Could not reindex elasticsearch index: ${index}`);
            console.log(ex.message);
            console.log(JSON.stringify(ex));
        }
    };

    /**
     *
     * Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
     */
    simulateStream(
        documentClient,
        createDynamoDBHandler({
            plugins: [
                elasticsearchClientContext,
                createDynamoDBToElasticsearchHandler(),
                createGzipCompression()
            ]
        })
    );

    const handler = createHandler({
        plugins: [
            getElasticsearchOperators(),
            dbPlugins({
                table: process.env.DB_TABLE,
                driver: new DynamoDbDriver({
                    documentClient
                })
            }),
            // TODO figure out a way to load these automatically
            createWcpContext(),
            createWcpGraphQL(),
            createFileManagerContext({
                storageOperations: createFileManagerStorageOperations({
                    documentClient
                })
            }),
            graphqlHandler(),
            ...createTenancyAndSecurity({
                documentClient
            }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            mockLocalesPlugins(),
            createPageBuilderGraphQL(),
            createPageBuilderContext({
                storageOperations
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
            /**
             * Mock file upload which does nothing.
             */
            {
                type: "api-file-manager-storage",
                name: "api-file-manager-storage",
                async upload() {
                    return;
                },
                async delete() {
                    return;
                }
            },
            createContextPlugin<PbContext>(async context => {
                context.pageBuilder.onPageAfterCreate.subscribe(async () => {
                    return refreshIndex();
                });
                context.pageBuilder.onPageAfterCreateFrom.subscribe(async () => {
                    return refreshIndex();
                });
                context.pageBuilder.onPageAfterUpdate.subscribe(async () => {
                    return refreshIndex();
                });
                context.pageBuilder.onPageAfterDelete.subscribe(async () => {
                    return refreshIndex();
                });
                context.pageBuilder.onPageAfterPublish.subscribe(async () => {
                    return refreshIndex();
                });
                context.pageBuilder.onPageAfterUnpublish.subscribe(async () => {
                    return refreshIndex();
                });
            }),
            ...(params.plugins || [])
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
            {} as any
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const clearElasticsearch = async () => {
        const index = getIndexName();
        try {
            return await elasticsearch.indices.delete({
                index,
                ignore_unavailable: true
            });
        } catch (ex) {
            console.log(`Could not delete elasticsearch index: ${index}`);
            console.log(ex.message);
            console.log(JSON.stringify(ex));
        }
        return null;
    };

    return {
        handler,
        invoke,
        elasticsearch,
        documentClient,
        clearElasticsearch,
        // General
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        // Categories
        async createCategory(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CATEGORY, variables } });
        },
        // Pages
        async getPage(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: createPageGetGraphQl({ fields }), variables } });
        },
        async getPublishedPage(variables: Record<string, any>, fields: string[] = []) {
            return invoke({
                body: { query: createPageGetPublishedGraphQl({ fields }), variables }
            });
        },
        async createPage(variables: Record<string, any>, fields: string[] = []) {
            return invoke({
                body: {
                    query: createPageCreateGraphQl({
                        fields
                    }),
                    variables
                }
            });
        },
        async updatePage(variables: Record<string, any>, fields: string[] = []) {
            return invoke({ body: { query: createPageUpdateGraphQl({ fields }), variables } });
        },
        async publishPage(variables: Record<string, any>) {
            return invoke({ body: { query: PUBLISH_PAGE, variables } });
        },
        async unpublishPage(variables: Record<string, any>) {
            return invoke({ body: { query: UNPUBLISH_PAGE, variables } });
        },
        async deletePage(variables: Record<string, any>) {
            return invoke({ body: { query: DELETE_PAGE, variables } });
        },
        async listPages(variables: Record<string, any> = {}, fields: string[] = []) {
            return invoke({
                body: {
                    query: createPageListGraphQl({
                        fields
                    }),
                    variables
                }
            });
        }
    };
};
