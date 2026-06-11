import { createRegisterExtensionPlugin } from "@webiny/handler";
import { default as DynamoDbDriver } from "./DynamoDbDriver.js";
import { ValueFilterFeature } from "@webiny/db-utils";
import { FilterUtilFeature } from "~/feature/FilterUtil/index.js";
import { DynamoDBClientFeature } from "~/feature/DynamoDBClient/index.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export * from "./utils/index.js";
export * from "./plugins/index.js";
export type { DbItem } from "./types.js";

export { DynamoDbDriver };

interface IRegisterDbDynamoDbExtension {
    documentClient: DynamoDBDocument;
}

export { DynamoDBClient } from "~/feature/DynamoDBClient/index.js";

export const registerDynamoDbExtension = ({ documentClient }: IRegisterDbDynamoDbExtension) => {
    return createRegisterExtensionPlugin(async context => {
        DynamoDBClientFeature.register(context.container, documentClient);
        FilterUtilFeature.register(context.container);
        ValueFilterFeature.register(context.container);
    });
};
