const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const elasticsearchClientContextPlugin = require("@webiny/api-elasticsearch").default;
const {
    createEventHandler: createDynamoDBToElasticsearchEventHandler
} = require("@webiny/api-dynamodb-to-elasticsearch");
const {
    createElasticsearchClient
} = require("@webiny/project-utils/testing/elasticsearch/createClient");
const { simulateStream } = require("@webiny/project-utils/testing/dynamodb");
const NodeEnvironment = require("jest-environment-node");
const { createGzipCompression } = require("@webiny/api-elasticsearch");
const { ContextPlugin } = require("@webiny/api");
const {
    elasticIndexManager
} = require("@webiny/project-utils/testing/helpers/elasticIndexManager");
/**
 * For this to work it must load plugins that have already been built
 */
const { createStorageOperations } = require("../../dist/index");
const { configurations } = require("../../dist/configurations");
const { base: baseConfigurationPlugin } = require("../../dist/elasticsearch/indices/base");
const { createHandler: createDynamoDBHandler } = require("@webiny/handler-aws/dynamodb");

if (typeof createStorageOperations !== "function") {
    throw new Error(`Loaded plugins file must export a function that returns an array of plugins.`);
}

const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";
process.env.ELASTIC_SEARCH_INDEX_PREFIX = `${prefix}api-page-builder-env-`;

class PageBuilderTestEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup();

        const elasticsearchClient = createElasticsearchClient();
        const documentClient = new DocumentClient({
            convertEmptyValues: true,
            endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
            sslEnabled: false,
            region: "local",
            accessKeyId: "test",
            secretAccessKey: "test"
        });
        const elasticsearchClientContext = elasticsearchClientContextPlugin(elasticsearchClient);

        /**
         * Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
         */
        const simulationContext = new ContextPlugin(async context => {
            context.plugins.register([createGzipCompression()]);
            await elasticsearchClientContext.apply(context);
        });
        simulateStream(
            documentClient,
            createDynamoDBHandler({
                plugins: [simulationContext, createDynamoDBToElasticsearchEventHandler()]
            })
        );

        const plugins = [
            createGzipCompression(),
            dbPlugins({
                table: process.env.DB_TABLE,
                driver: new DynamoDbDriver({
                    documentClient
                })
            })
        ];
        /**
         * This is a global function that will be called inside the tests to get all relevant plugins, methods and objects.
         */
        this.global.__getCreateStorageOperations = () => {
            return {
                createStorageOperations: params => {
                    const { plugins: testPlugins = [] } = params;
                    return createStorageOperations({
                        documentClient,
                        elasticsearch: elasticsearchClient,
                        table: table => ({ ...table, name: process.env.DB_TABLE }),
                        esTable: table => ({ ...table, name: process.env.DB_TABLE_ELASTICSEARCH }),
                        plugins: testPlugins.concat([createGzipCompression()])
                    });
                },
                getPlugins: () => {
                    return plugins;
                }
            };
        };

        elasticIndexManager({
            global: this.global,
            client: elasticsearchClient,
            onBeforeEach: async () => {
                const { index } = configurations.es({
                    locale: "en-US",
                    tenant: "root"
                });
                await elasticsearchClient.indices.create({
                    index,
                    body: {
                        ...baseConfigurationPlugin.body
                    }
                });
            }
        });
    }
}

module.exports = PageBuilderTestEnvironment;
