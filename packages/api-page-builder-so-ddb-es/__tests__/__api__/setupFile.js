const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { getElasticsearchClient } = require("@webiny/project-utils/testing/elasticsearch");
const { createStorageOperations } = require("@webiny/api-page-builder-so-ddb-es");
const { configurations } = require("@webiny/api-page-builder-so-ddb-es/configurations");
const {
    base: baseConfigurationPlugin
} = require("@webiny/api-page-builder-so-ddb-es/elasticsearch/indices/base");

module.exports = () => {
    setStorageOps("pageBuilder", () => {
        const documentClient = getDocumentClient();
        const { elasticsearchClient, plugins } = getElasticsearchClient({
            prefix: "api-page-builder-env-",
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
            storageOperations: createStorageOperations({
                documentClient,
                elasticsearch: elasticsearchClient,
                table: table => ({ ...table, name: process.env.DB_TABLE }),
                esTable: table => ({ ...table, name: process.env.DB_TABLE_ELASTICSEARCH })
            }),
            plugins: [
                ...plugins,
                dbPlugins({
                    table: process.env.DB_TABLE,
                    driver: new DynamoDbDriver({
                        documentClient
                    })
                })
            ]
        };
    });
};
