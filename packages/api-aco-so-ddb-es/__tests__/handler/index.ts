import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb";
import { createHeadlessCmsContext, createHeadlessCmsGraphQL } from "@webiny/api-headless-cms";
import { createStorageOperations as createHeadlessCmsStorageOperations } from "@webiny/api-headless-cms-ddb-es";
import { mockLocalesPlugins } from "@webiny/api-i18n/graphql/testing";
import i18nContext from "@webiny/api-i18n/graphql/context";
import dbPlugins from "@webiny/handler-db";
import i18nDynamoDbStorageOperations from "@webiny/api-i18n-ddb";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { createHandler } from "@webiny/handler-aws";
import createGraphQLHandler from "@webiny/handler-graphql";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { Plugin, PluginCollection } from "@webiny/plugins/types";
import { createTenancyAndSecurity } from "./tenancySecurity";
import elasticsearchClientContextPlugin, {
    createGzipCompression,
    getElasticsearchOperators
} from "@webiny/api-elasticsearch";
import { simulateStream } from "@webiny/project-utils/testing/dynamodb";
import { createEventHandler as createDynamoDBToElasticsearchEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";

import {
    CREATE_FOLDER,
    DELETE_FOLDER,
    GET_FOLDER,
    LIST_FOLDERS,
    UPDATE_FOLDER
} from "./graphql/folder.gql";
import {
    CREATE_RECORD,
    DELETE_RECORD,
    GET_RECORD,
    LIST_RECORDS,
    UPDATE_RECORD
} from "./graphql/record.gql";

import { createAco } from "@webiny/api-aco";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { ContextPlugin } from "@webiny/handler";
import { createDynamoDBHandler } from "@webiny/handler-aws";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import { AcoContext } from "@webiny/api-aco/types";
import { CmsContext, CmsModel } from "@webiny/api-headless-cms/types";
import { configurations } from "@webiny/api-headless-cms-ddb-es/configurations";
import { APIGatewayEvent, LambdaContext } from "@webiny/handler-aws/types";

export interface UseGQLHandlerParams {
    permissions?: SecurityPermission[];
    identity?: SecurityIdentity;
    plugins?: Plugin | Plugin[] | Plugin[][] | PluginCollection;
}

export interface InvokeParams {
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

const documentClient = getDocumentClient({
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
    tls: false,
    region: "local",
    credentials: { accessKeyId: "test", secretAccessKey: "test" }
});

export const useGraphQlHandler = (params: UseGQLHandlerParams = {}) => {
    const { permissions, identity, plugins = [] } = params;

    const elasticsearch = createElasticsearchClient();

    const elasticsearchClientContext = elasticsearchClientContextPlugin(elasticsearch);

    /**
     * Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
     */
    const simulationContext = new ContextPlugin<AcoContext & ElasticsearchContext>(
        async context => {
            context.plugins.register([createGzipCompression()]);
            await elasticsearchClientContext.apply(context);
        }
    );
    simulateStream(
        documentClient,
        createDynamoDBHandler({
            plugins: [simulationContext, createDynamoDBToElasticsearchEventHandler()]
        })
    );

    const createIndexName = (model: Pick<CmsModel, "tenant" | "locale" | "modelId">) => {
        const { index } = configurations.es({
            model
        });
        return index;
    };

    const handler = createHandler({
        plugins: [
            createGzipCompression(),
            getElasticsearchOperators(),
            createGraphQLHandler(),
            dbPlugins({
                table: process.env.DB_TABLE,
                driver: new DynamoDbDriver({
                    documentClient
                })
            }),
            ...createTenancyAndSecurity({ permissions, identity: identity || defaultIdentity }),
            i18nContext(),
            i18nDynamoDbStorageOperations(),
            mockLocalesPlugins(),
            createHeadlessCmsContext({
                storageOperations: createHeadlessCmsStorageOperations({
                    documentClient,
                    elasticsearch
                })
            }),
            new ContextPlugin<CmsContext>(async context => {
                context.cms.onEntryBeforeCreate.subscribe(async ({ model }) => {
                    elasticsearch.indices.create({
                        index: createIndexName(model)
                    });
                });
            }),
            createHeadlessCmsGraphQL(),
            createAco(),
            plugins
        ],
        debug: false
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
            } as unknown as APIGatewayEvent,
            {} as LambdaContext
        );

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    const aco = {
        async createFolder(variables = {}) {
            return invoke({ body: { query: CREATE_FOLDER, variables } });
        },
        async updateFolder(variables = {}) {
            return invoke({ body: { query: UPDATE_FOLDER, variables } });
        },
        async deleteFolder(variables = {}) {
            return invoke({ body: { query: DELETE_FOLDER, variables } });
        },
        async listFolders(variables = {}) {
            return invoke({ body: { query: LIST_FOLDERS, variables } });
        },
        async getFolder(variables = {}) {
            return invoke({ body: { query: GET_FOLDER, variables } });
        }
    };

    const search = {
        async createRecord(variables = {}) {
            return invoke({ body: { query: CREATE_RECORD, variables } });
        },
        async updateRecord(variables = {}) {
            return invoke({ body: { query: UPDATE_RECORD, variables } });
        },
        async deleteRecord(variables = {}) {
            return invoke({ body: { query: DELETE_RECORD, variables } });
        },
        async listRecords(variables = {}) {
            return invoke({ body: { query: LIST_RECORDS, variables } });
        },
        async getRecord(variables = {}) {
            return invoke({ body: { query: GET_RECORD, variables } });
        }
    };

    return {
        params,
        handler,
        invoke,
        aco,
        search,
        elasticsearch
    };
};
