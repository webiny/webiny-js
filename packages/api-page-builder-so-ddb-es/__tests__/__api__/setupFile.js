const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { logger } = require("@webiny/project-utils/testing/logger");
const { getElasticsearchClient } = require("@webiny/project-utils/testing/elasticsearch");
const { createStorageOperations } = require("@webiny/api-page-builder-so-ddb-es");
const { configurations } = require("@webiny/api-page-builder-so-ddb-es/configurations");
const {
    base: baseConfigurationPlugin
} = require("@webiny/api-page-builder-so-ddb-es/elasticsearch/indices/base");

module.exports = () => {
    logger.debug(`Execute "setupFile" in "api-page-builder-so-ddb-es"`);

    setStorageOps("pageBuilder", () => {
        logger.debug(`Instantiate storage ops in "api-page-builder-so-ddb-es"`);
        const documentClient = getDocumentClient();
        const { elasticsearchClient, plugins } = getElasticsearchClient({
            name: "api-page-builder-so-ddb-es",
            prefix: "api-page-builder-env-",
            onBeforeEach: async () => {
                logger.debug(`Start PB "onBeforeEach".`);
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
                logger.debug(`Finish PB "onBeforeEach".`);
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
