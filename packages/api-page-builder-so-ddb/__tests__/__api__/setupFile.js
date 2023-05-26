const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
/**
 * For this to work it must load plugins that have already been built
 */
const { createStorageOperations } = require("../../dist/index");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");

module.exports = () => {
    setStorageOps("pageBuilder", () => {
        return {
            storageOperations: createStorageOperations({
                documentClient: getDocumentClient(),
                table: table => ({ ...table, name: process.env.DB_TABLE })
            }),
            plugins: [
                dbPlugins({
                    table: process.env.DB_TABLE,
                    driver: new DynamoDbDriver({
                        documentClient: getDocumentClient()
                    })
                })
            ]
        };
    });
};
