const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { ContextPlugin } = require("@webiny/api");
const {
    createStorageOperations,
    createCmsEntryElasticsearchBodyModifierPlugin
} = require("../../dist/index");
const { configurations } = require("../../dist/configurations");
const { base: baseIndexConfigurationPlugin } = require("../../dist/elasticsearch/indices/base");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { getElasticsearchClient } = require("@webiny/project-utils/testing/elasticsearch");
const { getElasticsearchOperators } = require("@webiny/api-elasticsearch/operators");

if (typeof createStorageOperations !== "function") {
    throw new Error(`Loaded plugins file must export a function that returns an array of plugins.`);
}

const { getElasticsearchIndexPrefix } = require("@webiny/api-elasticsearch");

const prefix = getElasticsearchIndexPrefix();
if (!prefix.includes("api-")) {
    process.env.ELASTIC_SEARCH_INDEX_PREFIX = `${prefix}api-headless-cms-env-`;
}

module.exports = () => {
    setStorageOps("cms", () => {
        const documentClient = getDocumentClient();
        const { elasticsearchClient, plugins } = getElasticsearchClient({
            name: "api-headless-cms-ddb-es",
            prefix: "api-headless-cms-env-"
        });

        const createIndexName = model => {
            const { index } = configurations.es({
                model
            });
            return index;
        };

        /**
         * We need to create model index before entry create because of the direct storage operations tests.
         * When running direct storage ops tests, index is created on the fly otherwise and then it is not cleaned up afterwards.
         *
         * When creating, updating, creating from, publishing, unpublishing and deleting we need to refresh index.
         */
        const createOrRefreshIndexSubscription = new ContextPlugin(async context => {
            context.waitFor(["cms"], async () => {
                context.cms.onEntryBeforeCreate.subscribe(async ({ model }) => {
                    const index = createIndexName(model);
                    try {
                        const response = await elasticsearchClient.indices.exists({
                            index
                        });
                        if (response.body) {
                            return;
                        }
                        await elasticsearchClient.indices.create({
                            index,
                            body: {
                                ...baseIndexConfigurationPlugin.body
                            }
                        });
                    } catch (ex) {}
                });
            });
        });

        return {
            storageOperations: createStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient,
                plugins: [
                    getElasticsearchOperators(),
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
                ]
            }),
            plugins: [
                ...plugins,
                dbPlugins({
                    table: process.env.DB_TABLE,
                    driver: new DynamoDbDriver({
                        documentClient
                    })
                }),
                createOrRefreshIndexSubscription
            ]
        };
    });
};
