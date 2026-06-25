import { createRegisterExtensionPlugin } from "@webiny/handler";
import { default as DynamoDbDriver } from "./DynamoDbDriver.js";
import { ValueFilterFeature } from "@webiny/db-utils";
import { FilterUtilFeature } from "~/features/FilterUtil/index.js";
import { DynamoDBClientFeature } from "~/features/DynamoDBClient/index.js";
import { DynamoDbBatchFactoryFeature } from "~/features/DynamoDbBatchFactory/feature.js";
import { DynamoDbEntityFactoryFeature } from "~/features/DynamoDbEntityFactory/feature.js";
import { DynamoDbTableFactoryFeature } from "~/features/DynamoDbTableFactory/feature.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export * from "./utils/index.js";
export * from "./plugins/index.js";
export type { DbItem } from "./types.js";

export { DynamoDbDriver };

interface IRegisterDbDynamoDbExtension {
    documentClient: DynamoDBDocument;
}

export { DynamoDBClient } from "~/features/DynamoDBClient/index.js";

export const registerDynamoDBCore = ({ documentClient }: IRegisterDbDynamoDbExtension) => {
    return createRegisterExtensionPlugin(async context => {
        /* 1. Raw AWS client — no dependencies. */
        DynamoDBClientFeature.register(context.container, documentClient);
        /* 2. Batch factory — no dependencies. */
        DynamoDbBatchFactoryFeature.register(context.container);
        /* 3. Entity factory — resolves DynamoDbBatchFactory (registered in step 2). */
        DynamoDbEntityFactoryFeature.register(context.container);
        /* 4. Table factory — resolves DynamoDBClient (registered in step 1). */
        DynamoDbTableFactoryFeature.register(context.container);
        /* 5-6. Filters — no dependencies on the above. */
        FilterUtilFeature.register(context.container);
        ValueFilterFeature.register(context.container);
    });
};
