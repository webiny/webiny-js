const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { createStorageOperations } = require("@webiny/api-tenancy-so-ddb");

module.exports = async () => {
    setStorageOps("tenancy", () => {
        return {
            storageOperations: createStorageOperations({
                documentClient: getDocumentClient(),
                table: process.env.DB_TABLE
            }),
            plugins: []
        };
    });
};
