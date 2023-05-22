const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const dynamoDbPlugins = require("@webiny/db-dynamodb/plugins").default;
const { createFileManagerStorageOperations } = require("@webiny/api-file-manager-ddb");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");

module.exports = () => {
    setStorageOps("fileManager", () => {
        return {
            storageOperations: createFileManagerStorageOperations({
                documentClient: getDocumentClient()
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
