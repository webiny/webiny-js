const { getElasticsearchClient } = require("@webiny/project-utils/testing/elasticsearch");
const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { configurations } = require("../../dist/configurations");
const { base: baseConfigurationPlugin } = require("../../dist/elasticsearch/indices/base");
const { createFileManagerStorageOperations } = require("../../dist/index");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");

module.exports = async () => {
    setStorageOps("fileManager", () => {
        const documentClient = getDocumentClient();
        const { elasticsearchClient, plugins } = getElasticsearchClient({
            prefix: "api-file-manager-env-",
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
            storageOperations: createFileManagerStorageOperations({
                documentClient,
                elasticsearchClient
            }),
            plugins: [
                ...plugins,
                ...dbPlugins({
                    table: process.env.DB_TABLE,
                    driver: new DynamoDbDriver({
                        documentClient
                    })
                })
            ]
        };
    });
};
