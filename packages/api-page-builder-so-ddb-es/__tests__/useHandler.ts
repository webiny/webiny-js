import graphqlHandler from "@webiny/handler-graphql";
import i18nContext from "@webiny/api-i18n/graphql/context";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import prerenderingServicePlugins from "@webiny/api-prerendering-service/client";
import prerenderingHookPlugins from "@webiny/api-page-builder/prerendering/hooks";
import dbPlugins from "@webiny/handler-db";
import { getIntrospectionQuery } from "graphql";
import { createHandler } from "@webiny/handler-aws";
import { createPageBuilderContext, createPageBuilderGraphQL } from "@webiny/api-page-builder";
import { createStorageOperations } from "~/index";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createWcpContext, createWcpGraphQL } from "@webiny/api-wcp";
import { createTenancyAndSecurity } from "./tenancySecurity";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
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
import { createEventHandler as createDynamoDBToElasticsearchHandler } from "@webiny/api-dynamodb-to-elasticsearch";
import elasticsearchClientContextPlugin, {
    createGzipCompression,
    getElasticsearchOperators
} from "@webiny/api-elasticsearch";
import { simulateStream } from "@webiny/project-utils/testing/dynamodb";
import { configurations } from "~/configurations";
import { createAco } from "@webiny/api-aco";
import { createAcoPageBuilderContext } from "@webiny/api-page-builder-aco";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb-es";
import { configurations as cmsConfigurations } from "@webiny/api-headless-cms-ddb-es/configurations";
import { SEARCH_RECORD_MODEL_ID } from "@webiny/api-aco/record/record.model";
import { FOLDER_MODEL_ID } from "@webiny/api-aco/folder/folder.model";
import { LambdaContext } from "@webiny/handler-aws/types";

interface Params {
    plugins?: PluginCollection;
    withFields?: string[];
}

export const useHandler = (params: Params) => {
    const elasticsearch = createElasticsearchClient();
    const documentClient = getDocumentClient({
        endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
        tls: false,
        region: "local",
        credentials: { accessKeyId: "test", secretAccessKey: "test" }
    });

    const storageOperations = createStorageOperations({
        elasticsearch,
        documentClient
    });

    const elasticsearchClientContext = elasticsearchClientContextPlugin(elasticsearch);

    const getPageBuilderIndexName = () => {
        const { index } = configurations.es({
            tenant: "root",
            locale: "en-US"
        });
        return index;
    };
    const getAcoRecordsIndexName = () => {
        const { index } = cmsConfigurations.es({
            model: {
                modelId: SEARCH_RECORD_MODEL_ID,
                tenant: "root",
                locale: "en-US"
            }
        });
        return index;
    };
    const getAcoFoldersIndexName = () => {
        const { index } = cmsConfigurations.es({
            model: {
                modelId: FOLDER_MODEL_ID,
                tenant: "root",
                locale: "en-US"
            }
        });
        return index;
    };

    /**
     *
     * Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
     */
    simulateStream(
        documentClient,
        createHandler({
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
            createWcpContext(),
            createWcpGraphQL(),
            graphqlHandler(),
            ...createTenancyAndSecurity({
                documentClient
            }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: createHeadlessCmsStorageOperations({
                    documentClient,
                    elasticsearch
                })
            }),
            createHeadlessCmsGraphQL(),
            createPageBuilderGraphQL(),
            createPageBuilderContext({
                storageOperations
            }),
            createAco(),
            createAcoPageBuilderContext(),
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
            ...(params.plugins || [])
        ]
    });

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

        return [JSON.parse(response.body), response];
    };

    elasticsearch.indices.registerIndex([
        getPageBuilderIndexName(),
        getAcoRecordsIndexName(),
        getAcoFoldersIndexName()
    ]);

    const clearElasticsearch = async () => {
        await elasticsearch.indices.deleteAll();
        return null;
    };

    return {
        handler,
        invoke,
        elasticsearch,
        documentClient,
        clearElasticsearch,
        /**
         * General
         */
        async introspect() {
            return invoke({ body: { query: getIntrospectionQuery() } });
        },
        /**
         * Categories
         */
        async createCategory(variables: Record<string, any>) {
            return invoke({ body: { query: CREATE_CATEGORY, variables } });
        },
        /**
         * Pages
         */
        async getPage(variables: Record<string, any>, fields: string[] = params.withFields || []) {
            return invoke({ body: { query: createPageGetGraphQl({ fields }), variables } });
        },
        async getPublishedPage(
            variables: Record<string, any>,
            fields: string[] = params.withFields || []
        ) {
            return invoke({
                body: { query: createPageGetPublishedGraphQl({ fields }), variables }
            });
        },
        async createPage(
            variables: Record<string, any>,
            fields: string[] = params.withFields || []
        ) {
            return invoke({
                body: {
                    query: createPageCreateGraphQl({
                        fields
                    }),
                    variables
                }
            });
        },
        async updatePage(
            variables: Record<string, any>,
            fields: string[] = params.withFields || []
        ) {
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
        async listPages(
            variables: Record<string, any> = {},
            fields: string[] = params.withFields || []
        ) {
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
