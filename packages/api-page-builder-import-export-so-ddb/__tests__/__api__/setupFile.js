const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { createStorageOperations } = require("../../dist/index");

module.exports = () => {
    setStorageOps("pageBuilderImportExport", () => {
        return {
            storageOperations: createStorageOperations({
                documentClient: getDocumentClient(),
                table: process.env.DB_TABLE
            }),
            plugins: []
        };
    });
};
