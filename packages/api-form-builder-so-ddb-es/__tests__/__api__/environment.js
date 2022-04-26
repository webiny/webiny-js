const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const createElasticsearchClientContextPlugin = require("@webiny/api-elasticsearch").default;
const { createHandler } = require("@webiny/handler-aws");
const dynamoToElastic = require("@webiny/api-dynamodb-to-elasticsearch/handler").default;
const { simulateStream } = require("@webiny/project-utils/testing/dynamodb");
const NodeEnvironment = require("jest-environment-node");
const elasticsearchDataGzipCompression =
    require("@webiny/api-elasticsearch/plugins/GzipCompression").default;
const { ContextPlugin } = require("@webiny/handler");
const dynamoDbPlugins = require("@webiny/db-dynamodb/plugins").default;
const { createElasticsearchClient } = require("@webiny/api-elasticsearch/client");
const { getElasticsearchOperators } = require("@webiny/api-elasticsearch/operators");
/**
 * For this to work it must load plugins that have already been built
 */
const { createFormBuilderStorageOperations } = require("../../dist/index");
const { base: baseElasticsearchIndexTemplate } = require("../../dist/elasticsearch/templates/base");
const {
    elasticIndexManager
} = require("@webiny/project-utils/testing/helpers/elasticIndexManager");

if (typeof createFormBuilderStorageOperations !== "function") {
    throw new Error(
        `Loaded "createFormBuilderStorageOperations" must be a function that will return the storage operations.`
    );
}

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9200";

class FormBuilderTestEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup();

        const elasticsearchClient = createElasticsearchClient({
            node: `http://localhost:${ELASTICSEARCH_PORT}`,
            auth: {}
        });
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
            context.plugins.register([elasticsearchDataGzipCompression()]);
            await elasticsearchClientContext.apply(context);
        });
        simulateStream(documentClient, createHandler(simulationContext, dynamoToElastic()));

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
                        elasticsearch: elasticsearchClient,
                        plugins: [
                            ...dynamoDbPlugins(),
                            elasticsearchDataGzipCompression(),
                            ...getElasticsearchOperators()
                        ]
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
                        elasticsearchDataGzipCompression(),
                        ...getElasticsearchOperators()
                    ];
                }
            };
        };

        // Each test should work with its own ES index, and only those indexes have to be deleted.
        elasticIndexManager({
            global: this.global,
            client: elasticsearchClient,
            template: baseElasticsearchIndexTemplate.template
        });
    }
}

module.exports = FormBuilderTestEnvironment;
