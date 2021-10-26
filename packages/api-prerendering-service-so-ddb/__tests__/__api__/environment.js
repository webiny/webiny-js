const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const NodeEnvironment = require("jest-environment-node");
/**
 * For this to work it must load plugins that have already been built
 */
const { createPrerenderingServiceStorageOperations } = require("../../dist/index");

if (typeof createPrerenderingServiceStorageOperations !== "function") {
    throw new Error(
        `Loaded "createPrerenderingServiceStorageOperations" must be a function that will return the storage operations.`
    );
}

class PrerenderingServiceTestEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup();

        const documentClient = new DocumentClient({
            convertEmptyValues: true,
            endpoint: process.env.MOCK_DYNAMODB_ENDPOINT || "http://localhost:8001",
            sslEnabled: false,
            region: "local",
            accessKeyId: "test",
            secretAccessKey: "test"
        });
        /**
         * This is a global function that will be called inside the tests to get all relevant plugins, methods and objects.
         */
        this.global.__getStorageOperations = () => {
            return {
                createStorageOperations: () => {
                    return createPrerenderingServiceStorageOperations({
                        table: process.env.DB_TABLE,
                        documentClient
                    });
                }
            };
        };
    }
}

module.exports = PrerenderingServiceTestEnvironment;
