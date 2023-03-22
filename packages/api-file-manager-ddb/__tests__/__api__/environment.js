const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const dynamoDbPlugins = require("@webiny/db-dynamodb/plugins").default;
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const NodeEnvironment = require("jest-environment-node");
const { createFileManagerStorageOperations } = require("../../dist");

class FileManagerTestEnvironment extends NodeEnvironment {
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
        this.global.__getStorageOperationsPlugins = () => {
            return {
                createStorageOperations: params => {
                    const { plugins: testPlugins = [] } = params;
                    return createFileManagerStorageOperations({
                        documentClient,
                        plugins: testPlugins
                    });
                },
                getPlugins: () => {
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

module.exports = FileManagerTestEnvironment;
