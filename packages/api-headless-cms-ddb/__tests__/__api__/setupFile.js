const dbPlugins = require("@webiny/handler-db").default;
const { DynamoDbDriver } = require("@webiny/db-dynamodb");
const { createStorageOperations, createCmsEntryFieldSortingPlugin } = require("../../dist/index");
const { setStorageOps } = require("@webiny/project-utils/testing/environment");
const { getDocumentClient } = require("@webiny/project-utils/testing/dynamodb");

module.exports = () => {
    setStorageOps("cms", () => {
        const documentClient = getDocumentClient();

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

        return {
            storageOperations: createStorageOperations({
                documentClient,
                table: table => ({ ...table, name: process.env.DB_TABLE })
            }),
            plugins
        };
    });
};
