const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const dbPlugins = require("@webiny/handler-db").default;
const NodeEnvironment = require("jest-environment-node");
const dynamoDbPlugins = require("@webiny/db-dynamodb/plugins").default;
/**
 * For this to work it must load plugins that have already been built
 */
const { createStorageOperations } = require("../../dist/index");

if (typeof createStorageOperations !== "function") {
    throw new Error(
        `Loaded "createStorageOperations" must be a function that will return the storage operations.`
    );
}

class FoldersTestEnvironment extends NodeEnvironment {
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
                    return createStorageOperations({
                        table: process.env.DB_TABLE,
                        documentClient,
                        plugins: [...dynamoDbPlugins()]
                    });
                },
                getGlobalPlugins: () => {
                    return [
                        ...dbPlugins({
                            table: process.env.DB_TABLE,
                            driver: new DynamoDbDriver({
                                documentClient
                            })
                        }),
                        ...dynamoDbPlugins()
                    ];
                }
            };
        };
    }
}

module.exports = FoldersTestEnvironment;
