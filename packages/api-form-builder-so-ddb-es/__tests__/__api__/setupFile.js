const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { createFormBuilderStorageOperations } = require("../../dist/index");
const { configurations } = require("../../dist/configurations");
const { base: baseConfigurationPlugin } = require("../../dist/elasticsearch/indices/base");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { getElasticsearchClient } = require("@webiny/project-utils/testing/elasticsearch");
const { getElasticsearchIndexPrefix } = require("@webiny/api-elasticsearch");

const prefix = getElasticsearchIndexPrefix();
if (!prefix.includes("api-")) {
    process.env.ELASTIC_SEARCH_INDEX_PREFIX = `${prefix}api-form-builder-env-`;
}

module.exports = () => {
    setStorageOps("formBuilder", () => {
        const documentClient = getDocumentClient();
        const { elasticsearchClient, plugins } = getElasticsearchClient({
            name: "api-form-builder-so-ddb-es",
            prefix: "api-form-builder-env-",
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

        return {
            storageOperations: createFormBuilderStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient
            }),
            plugins: [
                ...plugins,
                ...dbPlugins({
                    table: process.env.DB_TABLE,
                    driver: new DynamoDbDriver({
                        documentClient
                    })
                })
                // ...dynamoDbPlugins()
            ]
        };
    });
};
