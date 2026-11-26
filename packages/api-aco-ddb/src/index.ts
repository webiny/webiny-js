import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { DynamoDBClientFeature } from "@webiny/db-dynamodb";
import { AcoDdbFeature } from "./AcoDdbFeature.js";

interface RegisterAcoDdbStorageOperationsParams {
    documentClient: DynamoDBDocument;
}

export const registerAcoDdbStorageOperations = (params: RegisterAcoDdbStorageOperationsParams) => {
    return createRegisterExtensionPlugin(context => {
        // The storage injects `DynamoDBClient`; this one wraps the given document client.
        DynamoDBClientFeature.register(context.container, params.documentClient);
        AcoDdbFeature.register(context.container);
    });
};
export { AcoDdbFeature } from "./AcoDdbFeature.js";
