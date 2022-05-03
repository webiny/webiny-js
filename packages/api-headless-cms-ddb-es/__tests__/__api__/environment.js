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
const { configurations } = require("../../dist/configurations");
const { base: baseIndexConfigurationPlugin } = require("../../dist/elasticsearch/indices/base");

if (typeof createStorageOperations !== "function") {
    throw new Error(`Loaded plugins file must export a function that returns an array of plugins.`);
}

const prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";
process.env.ELASTIC_SEARCH_INDEX_PREFIX = `${prefix}api-headless-cms-env-`;

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

        //const onBeforeEntryList = new ContextPlugin(async context => {
        //if (!context.cms) {
        //    return;
        //}
        //context.cms.onBeforeEntryList.subscribe(async ({ model }) => {
        //    console.log("Refreshing index on before listing...");
        //    const { index } = configurations.es({
        //        model
        //    });
        //    await elasticsearchClient.indices.refresh({
        //        index,
        //        ignore_unavailable: true,
        //        expand_wildcards: "all"
        //    });
        //});
        //});
        /**
         * We need to create model index before entry create because of the direct storage operations tests.
         * When running direct storage ops tests, index is created on the fly otherwise and then it is not cleaned up afterwards.
         */
        const onBeforeEntryCreate = new ContextPlugin(async context => {
            if (!context.cms) {
                return;
            }
            context.cms.onBeforeEntryCreate.subscribe(async ({ model }) => {
                const { index } = configurations.es({
                    model
                });
                const response = await elasticsearchClient.indices.exists({
                    index,
                    ignore_unavailable: true
                });
                if (response.body) {
                    return;
                }
                try {
                    await elasticsearchClient.indices.create({
                        index,
                        body: {
                            ...baseIndexConfigurationPlugin.body
                        }
                    });
                    await elasticsearchClient.indices.refresh({
                        index
                    });
                } catch (ex) {
                    console.log("Could not create index on before entry create...");
                    console.log(JSON.stringify(ex));
                }
            });
        });
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
                        plugins: testPlugins.concat([
                            elasticsearchDataGzipCompression(),
                            //onBeforeEntryList,
                            onBeforeEntryCreate
                        ])
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
