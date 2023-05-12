const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { DocumentClient } = require("aws-sdk/clients/dynamodb");
const NodeEnvironment = require("jest-environment-node");
/**
 * For this to work it must load plugins that have already been built
 */
const { createStorageOperations, createCmsEntryFieldSortingPlugin } = require("../../dist/index");

if (typeof createStorageOperations !== "function") {
    throw new Error(`Loaded plugins file must export a function that returns an array of plugins.`);
}

class CmsTestEnvironment extends NodeEnvironment {
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
            }),
            createCmsEntryFieldSortingPlugin({
                canUse: params => {
                    const { fieldId } = params;
                    return fieldId === "customSorter";
                },
                createSort: params => {
                    const { order, fields } = params;

                    const field = Object.values(fields).find(f => f.fieldId === "createdBy");
                    if (!field) {
                        throw new Error("Impossible, but it seems there is no field createdBy.");
                    }
                    return {
                        reverse: order === "DESC",
                        valuePath: "createdBy.id",
                        field,
                        fieldId: field.fieldId
                    };
                }
            })
        ];

        /**
         * This is a global function that will be called inside the tests to get all relevant plugins, methods and objects.
         */
        this.global.__getCreateStorageOperations = () => {
            return {
                createStorageOperations: params => {
                    const { plugins: testPlugins = [] } = params;
                    return createStorageOperations({
                        documentClient,
                        table: table => ({ ...table, name: process.env.DB_TABLE }),
                        plugins: testPlugins
                    });
                },
                getPlugins: () => {
                    return plugins;
                }
            };
        };
    }
}

module.exports = CmsTestEnvironment;
