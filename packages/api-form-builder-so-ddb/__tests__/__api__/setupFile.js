const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const dbPlugins = require("@webiny/handler-db").default;
const dynamoDbPlugins = require("@webiny/db-dynamodb/plugins").default;
/**
 * For this to work it must load plugins that have already been built
 */
const { createFormBuilderStorageOperations } = require("../../dist/index");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");

module.exports = () => {
    setStorageOps("formBuilder", () => {
        return {
            storageOperations: createFormBuilderStorageOperations({
                table: process.env.DB_TABLE,
                documentClient: getDocumentClient(),
                plugins: [...dynamoDbPlugins()]
            }),
            plugins: [
                ...dbPlugins({
                    table: process.env.DB_TABLE,
                    driver: new DynamoDbDriver({
                        documentClient: getDocumentClient()
                    })
                }),
                ...dynamoDbPlugins()
            ]
        };
    });
};
