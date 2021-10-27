const dbPlugins = require("@webiny/handler-db").default;
const dynamoDbPlugins = require("@webiny/db-dynamodb/plugins").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const NodeEnvironment = require("jest-environment-node");
/**
 * For this to work it must load plugins that have already been built
 */
const plugins = require("../../dist/index").default;

if (typeof plugins !== "function") {
    throw new Error(`Loaded plugins file must export a function that returns an array of plugins.`);
}

const getStorageOperationsPlugins = ({ documentClient }) => {
    return () => {
        return [
            ...plugins(),
            ...dbPlugins({
                table: process.env.DB_TABLE,
                driver: new DynamoDbDriver({
                    documentClient
                })
            }),
            ...dynamoDbPlugins()
        ];
    };
};

class I18nTestEnvironment extends NodeEnvironment {
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
            return getStorageOperationsPlugins({
                documentClient
            });
        };
    }
}

module.exports = I18nTestEnvironment;
