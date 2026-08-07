import { dbPlugins } from "@webiny/db-dynamodb/testing.js";
import { registerDynamoDBCore } from "@webiny/db-dynamodb";
import { HeadlessCmsDdbFeature } from "../../src";
import { FieldSortingRegistry } from "@webiny/api-headless-cms-storage";
import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { getDocumentClient } from "@webiny/api-core-ddb/testing/getDocumentClient.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";

setStorageOps("cms", () => {
    const documentClient = getDocumentClient();

    const plugins = [
        registerDynamoDBCore({
            documentClient
        }),
        createRegisterExtensionPlugin(context => HeadlessCmsDdbFeature.register(context.container)),
        /**
         * TODO remove when all apps are created with their own storage operations factory and drivers.
         */
        dbPlugins(),
        createRegisterExtensionPlugin(({ container }) => {
            const sortingRegistry = container.resolve(FieldSortingRegistry);
            sortingRegistry.register({
                canUse: params => params.fieldId === "customSorter",
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
            });
        })
    ];

    return {
        storageOperations: {},
        plugins
    };
});
