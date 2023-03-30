const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const createElasticsearchClientContextPlugin = require("@webiny/api-elasticsearch").default;
const {
    createEventHandler: createDynamoDBToElasticsearchEventHandler
} = require("@webiny/api-dynamodb-to-elasticsearch");
const { simulateStream } = require("@webiny/project-utils/testing/dynamodb");
const NodeEnvironment = require("jest-environment-node");
const { createGzipCompression } = require("@webiny/api-elasticsearch");
const { ContextPlugin } = require("@webiny/api");
const dynamoDbPlugins = require("@webiny/db-dynamodb/plugins").default;
const {
    createElasticsearchClient
} = require("@webiny/project-utils/testing/elasticsearch/createClient");
/**
 * For this to work it must load plugins that have already been built
 */
const { createFormBuilderStorageOperations } = require("../../dist/index");
const { configurations } = require("../../dist/configurations");
const { base: baseConfigurationPlugin } = require("../../dist/elasticsearch/indices/base");

const {
    elasticIndexManager
} = require("@webiny/project-utils/testing/helpers/elasticIndexManager");
const { createHandler: createDynamoDBHandler } = require("@webiny/handler-aws/dynamodb");

if (typeof createFormBuilderStorageOperations !== "function") {
    throw new Error(
        `Loaded "createFormBuilderStorageOperations" must be a function that will return the storage operations.`
    );
}

const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";
process.env.ELASTIC_SEARCH_INDEX_PREFIX = `${prefix}api-form-builder-env-`;

class FormBuilderTestEnvironment extends NodeEnvironment {
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
        const elasticsearchClientContext =
            createElasticsearchClientContextPlugin(elasticsearchClient);

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

        /**
         * This is a global function that will be called inside the tests to get all relevant plugins, methods and objects.
         */
        this.global.__getStorageOperations = () => {
            return {
                createStorageOperations: () => {
                    return createFormBuilderStorageOperations({
                        table: process.env.DB_TABLE,
                        esTable: process.env.DB_TABLE_ELASTICSEARCH,
                        documentClient,
                        // TODO need to insert elasticsearch client
                        elasticsearch: elasticsearchClient
                    });
                },
                getGlobalPlugins: () => {
                    return [
                        elasticsearchClientContext,
                        ...dbPlugins({
                            table: process.env.DB_TABLE,
                            driver: new DynamoDbDriver({
                                documentClient
                            })
                        }),
                        ...dynamoDbPlugins(),
                        createGzipCompression()
                    ];
                }
            };
        };

        // Each test should work with its own ES index, and only those indexes have to be deleted.
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

module.exports = FormBuilderTestEnvironment;
