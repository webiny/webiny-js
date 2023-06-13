const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { createStorageOperations } = require("../../dist/index");

module.exports = () => {
    setStorageOps("adminUsers", () => {
        return {
            storageOperations: createStorageOperations({
                documentClient: getDocumentClient(),
                table: process.env.DB_TABLE
            }),
            plugins: []
        };
    });
};
