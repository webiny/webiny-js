const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const elasticsearchClientContextPlugin = require("@webiny/api-elasticsearch").default;
const { createHandler } = require("@webiny/handler-aws");
const dynamoToElastic = require("@webiny/api-dynamodb-to-elasticsearch/handler").default;
const { simulateStream } = require("@webiny/project-utils/testing/dynamodb");
const NodeEnvironment = require("jest-environment-node");
const elasticsearchDataGzipCompression =
    require("@webiny/api-elasticsearch/plugins/GzipCompression").default;
const { ContextPlugin } = require("@webiny/handler");
const {
    elasticIndexManager
} = require("@webiny/project-utils/testing/helpers/elasticIndexManager");
const {
    createElasticsearchClient
} = require("@webiny/project-utils/testing/elasticsearch/createClient");

const modelFieldToGraphQLPlugins =
    require("@webiny/api-headless-cms/content/plugins/graphqlFields").default;
/**
 * For this to work it must load plugins that have already been built
 */
const { createStorageOperations } = require("../../dist/index");

if (typeof createStorageOperations !== "function") {
    throw new Error(`Loaded plugins file must export a function that returns an array of plugins.`);
}

class CmsTestEnvironment extends NodeEnvironment {
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

        const plugins = [
            elasticsearchDataGzipCompression(),
            /**
             * TODO remove when all apps are created with their own storage operations factory and drivers.
             */
            dbPlugins({
                table: process.env.DB_TABLE,
                driver: new DynamoDbDriver({
                    documentClient
                })
            })
        ];

        /**
         * Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
         */
        const simulationContext = new ContextPlugin(async context => {
            context.plugins.register([elasticsearchDataGzipCompression()]);
            await elasticsearchClientContext.apply(context);
        });
        simulateStream(documentClient, createHandler(simulationContext, dynamoToElastic()));

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
                        modelFieldToGraphQLPlugins: modelFieldToGraphQLPlugins(),
                        table: table => ({ ...table, name: process.env.DB_TABLE }),
                        esTable: table => ({ ...table, name: process.env.DB_TABLE_ELASTICSEARCH }),
                        plugins: testPlugins.concat([elasticsearchDataGzipCompression()])
                    });
                },
                getPlugins: () => {
                    return plugins;
                }
            };
        };

        elasticIndexManager({
            global: this.global,
            client: elasticsearchClient
        });
    }
}

module.exports = CmsTestEnvironment;
