const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");
const { createPrerenderingServiceStorageOperations } = require("../../dist/index");

module.exports = () => {
    setStorageOps("prerenderingService", () => {
        return {
            storageOperations: createPrerenderingServiceStorageOperations({
                table: table => ({ ...table, name: process.env.DB_TABLE }),
                documentClient: getDocumentClient()
            }),
            plugins: []
        };
    });
};
