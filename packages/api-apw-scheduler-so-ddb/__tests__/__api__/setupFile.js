const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { createStorageOperations } = require("../../dist/index");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");

module.exports = () => {
    setStorageOps("apwSchedule", () => {
        return {
            storageOperations: createStorageOperations({
                documentClient: getDocumentClient(),
                table: process.env.DB_TABLE
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
