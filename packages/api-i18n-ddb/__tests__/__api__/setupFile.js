const dbPlugins = require("@webiny/handler-db").default;
const dynamoDbPlugins = require("@webiny/db-dynamodb/plugins").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { createI18NStorageOperations } = require("@webiny/api-i18n-ddb");

/**
 * i18n is the only remaining package that does not inject storage operations instance into the context
 * directly, and instead, uses a bunch of plugins, which are then picked up by the context.
 */
module.exports = () => {
    setStorageOps("i18n", () => {
        return {
            storageOperations: [
                ...createI18NStorageOperations(),
                ...dbPlugins({
                    table: process.env.DB_TABLE,
                    driver: new DynamoDbDriver({
                        documentClient: getDocumentClient()
                    })
                }),
                ...dynamoDbPlugins()
            ],
            plugins: []
        };
    });
};
