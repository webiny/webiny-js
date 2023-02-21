const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const elasticsearchClientContextPlugin = require("@webiny/api-elasticsearch").default;
const {
    createEventHandler: createDynamoDBToElasticsearchEventHandler
} = require("@webiny/api-dynamodb-to-elasticsearch");
const { simulateStream } = require("@webiny/project-utils/testing/dynamodb");
const NodeEnvironment = require("jest-environment-node");
const { createGzipCompression } = require("@webiny/api-elasticsearch");
const { ContextPlugin } = require("@webiny/api");
const {
    elasticIndexManager
} = require("@webiny/project-utils/testing/helpers/elasticIndexManager");
const {
    createElasticsearchClient
} = require("@webiny/project-utils/testing/elasticsearch/createClient");
/**
 * For this to work it must load plugins that have already been built
 */
const {
    createStorageOperations,
    createCmsEntryElasticsearchBodyModifierPlugin
} = require("../../dist/index");
const { configurations } = require("../../dist/configurations");
const { base: baseIndexConfigurationPlugin } = require("../../dist/elasticsearch/indices/base");
const { createHandler: createDynamoDBHandler } = require("@webiny/handler-aws/dynamodb");

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

        const createIndexName = model => {
            const { index } = configurations.es({
                model
            });
            return index;
        };
        const refreshIndex = model => {
            const index = createIndexName(model);
            return elasticsearchClient.indices.refresh({
                index
            });
        };
        /**
         * We need to create model index before entry create because of the direct storage operations tests.
         * When running direct storage ops tests, index is created on the fly otherwise and then it is not cleaned up afterwards.
         */
        const onEntryBeforeCreate = new ContextPlugin(async context => {
            context.waitFor(["cms"], async () => {
                context.cms.onEntryBeforeCreate.subscribe(async ({ model }) => {
                    const index = createIndexName(model);
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
                        await refreshIndex(model);
                    } catch (ex) {
                        console.log("Could not create index on before entry create...");
                        console.log(JSON.stringify(ex));
                    }
                });
            });
        });
        /**
         * When creating, updating, creating from, publishing, unpublishing and deleting we need to refresh index.
         */
        const refreshIndexSubscription = new ContextPlugin(async context => {
            context.waitFor(["cms"], async () => {
                context.cms.onEntryAfterCreate.subscribe(async ({ model }) => {
                    await refreshIndex(model);
                });
                context.cms.onEntryAfterUpdate.subscribe(async ({ model }) => {
                    await refreshIndex(model);
                });
                context.cms.onEntryRevisionAfterCreate.subscribe(async ({ model }) => {
                    await refreshIndex(model);
                });
                context.cms.onEntryAfterPublish.subscribe(async ({ model }) => {
                    await refreshIndex(model);
                });
                context.cms.onEntryAfterRepublish.subscribe(async ({ model }) => {
                    await refreshIndex(model);
                });
                context.cms.onEntryAfterUnpublish.subscribe(async ({ model }) => {
                    await refreshIndex(model);
                });
                context.cms.onEntryRevisionAfterDelete.subscribe(async ({ model }) => {
                    await refreshIndex(model);
                });
                context.cms.onEntryAfterDelete.subscribe(async ({ model }) => {
                    await refreshIndex(model);
                });
            });
        });

        const plugins = [
            createGzipCompression(),
            /**
             * TODO remove when all apps are created with their own storage operations factory and drivers.
             */
            dbPlugins({
                table: process.env.DB_TABLE,
                driver: new DynamoDbDriver({
                    documentClient
                })
            }),
            refreshIndexSubscription
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
                        plugins: testPlugins.concat([
                            createGzipCompression(),
                            onEntryBeforeCreate,
                            createCmsEntryElasticsearchBodyModifierPlugin({
                                modifyBody: ({ body }) => {
                                    if (!body.sort.customSorter) {
                                        return;
                                    }
                                    const order = body.sort.customSorter.order;
                                    delete body.sort.customSorter;

                                    body.sort = {
                                        createdOn: {
                                            order,
                                            unmapped_type: "date"
                                        }
                                    };
                                },
                                model: "fruit"
                            })
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
