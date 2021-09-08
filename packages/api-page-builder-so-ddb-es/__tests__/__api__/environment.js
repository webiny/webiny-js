const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const elasticsearchClientContextPlugin = require("@webiny/api-elasticsearch").default;
const { createHandler } = require("@webiny/handler-aws");
const dynamoToElastic = require("@webiny/api-dynamodb-to-elasticsearch/handler").default;
const { Client } = require("@elastic/elasticsearch");
const { simulateStream } = require("@webiny/project-utils/testing/dynamodb");
const NodeEnvironment = require("jest-environment-node");
const elasticsearchDataGzipCompression =
    require("@webiny/api-elasticsearch/plugins/GzipCompression").default;
const { ContextPlugin } = require("@webiny/handler/plugins/ContextPlugin");
const dynamoDbPlugins = require("@webiny/db-dynamodb/plugins").default;
/**
 * For this to work it must load plugins that have already been built
 */
const plugins = require("../../dist/index").default;

if (typeof plugins !== "function") {
    throw new Error(`Loaded plugins file must export a function that returns an array of plugins.`);
}

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9200";

const getStorageOperationsPlugins = ({ documentClient, elasticsearchClientContext }) => {
    return () => {
        const dbPluginsValue = dbPlugins({
            table: "PageBuilder",
            driver: new DynamoDbDriver({
                documentClient
            })
        });
        return [
            elasticsearchDataGzipCompression(),
            ...plugins(),
            ...dbPluginsValue,
            elasticsearchClientContext,
            ...dynamoDbPlugins()
        ];
    };
};

class PageBuilderTestEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup();

        const elasticsearchClient = new Client({
            node: `http://localhost:${ELASTICSEARCH_PORT}`
        });
        const documentClient = new DocumentClient({
            convertEmptyValues: true,
            endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
            sslEnabled: false,
            region: "local",
            accessKeyId: "test",
            secretAccessKey: "test"
        });
        const elasticsearchClientContext = elasticsearchClientContextPlugin({
            endpoint: `http://localhost:${ELASTICSEARCH_PORT}`,
            auth: {}
        });

        /**
         * Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
         */
        const simulationContext = new ContextPlugin(async context => {
            context.plugins.register([elasticsearchDataGzipCompression()]);
            await elasticsearchClientContext.apply(context);
        });
        simulateStream(documentClient, createHandler(simulationContext, dynamoToElastic()));

        const clearElasticsearchIndices = async () => {
            return elasticsearchClient.indices.delete({
                index: "_all"
            });
        };
        /**
         * This is a global function that will be called inside the tests to get all relevant plugins, methods and objects.
         */
        this.global.__getStorageOperationsPlugins = () => {
            return getStorageOperationsPlugins({
                elasticsearchClientContext,
                documentClient
            });
        };
        this.global.__beforeEach = clearElasticsearchIndices;
        this.global.__afterEach = async () => {
            // dummy method
        };
        this.global.__beforeAll = async () => {
            // dummy method
        };
        this.global.__afterAll = clearElasticsearchIndices;
    }
}

module.exports = PageBuilderTestEnvironment;
