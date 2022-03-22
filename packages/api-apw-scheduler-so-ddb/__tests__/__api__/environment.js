const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const NodeEnvironment = require("jest-environment-node");
/**
 * For this to work it must load plugins that have already been built
 */
const { createStorageOperations } = require("../../dist/index");

class ApwScheduleActionTestEnvironment extends NodeEnvironment {
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

        const plugins = [
            /**
             * TODO remove when all apps are created with their own storage operations factory and drivers.
             */
            dbPlugins({
                table: process.env.DB_TABLE,
                driver: new DynamoDbDriver({
                    documentClient
                })
            })
        ];

        /**
         * This is a global function that will be called inside the tests to get all relevant plugins, methods and objects.
         */
        this.global.__getStorageOperations = () => {
            return {
                storageOperations: createStorageOperations({
                    documentClient,
                    table: process.env.DB_TABLE
                }),
                plugins
            };
        };
    }
}

module.exports = ApwScheduleActionTestEnvironment;
