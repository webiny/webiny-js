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
/**
 * For this to work it must load plugins that have already been built
 */
const plugins = require("../../dist/index").default;

if (typeof plugins !== "function") {
    throw new Error(`Loaded plugins file must export a function that returns an array of plugins.`);
}

const ELASTICSEARCH_PORT = process.env.ELASTICSEARCH_PORT || "9200";

const getStorageOperationsPlugins = ({ documentClient, elasticsearchClientContext }) => {
    /**
     * Intercept DocumentClient operations and trigger dynamoToElastic function (almost like a DynamoDB Stream trigger)
     */
    const simulationContext = new ContextPlugin(async context => {
        context.plugins.register([elasticsearchDataGzipCompression()]);
        await elasticsearchClientContext.apply(context);
    });
    simulateStream(documentClient, createHandler(simulationContext, dynamoToElastic()));

    return () => {
        const pluginsValue = plugins();
        const dbPluginsValue = dbPlugins({
            table: "FileManager",
            driver: new DynamoDbDriver({
                documentClient
            })
        });
        return [
            elasticsearchDataGzipCompression(),
            ...pluginsValue,
            ...dbPluginsValue,
            elasticsearchClientContext
        ];
    };
};

class FileManagerTestEnvironment extends NodeEnvironment {
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
        const clearEsIndices = async () => {
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
        this.global.__beforeEach = async () => {
            await clearEsIndices();
            return elasticsearchClient.indices.create({
                index: "root-file-manager"
            });
        };
        this.global.__afterEach = clearEsIndices;
        this.global.__beforeAll = clearEsIndices;
        this.global.__afterAll = clearEsIndices;
    }
}

module.exports = FileManagerTestEnvironment;
