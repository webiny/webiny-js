import { createFeature } from "@webiny/feature/api";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { ApiCoreStorageOperationsFactory } from "@webiny/api-core";
import { createApiCoreDdb } from "./createApiCoreDdb.js";

export interface ApiCoreDdbConfig {
    documentClient: DynamoDBDocument;
}

/**
 * Registers the DynamoDB implementation of ApiCoreStorageOperationsFactory. ApiCoreFeature.register
 * resolves + builds it. Mirrors HeadlessCmsDdbFeature.
 */
export const ApiCoreDdbFeature = createFeature<ApiCoreDdbConfig>({
    name: "ApiCoreDdb",
    register(container, { documentClient }) {
        container.registerInstance(ApiCoreStorageOperationsFactory, {
            create: () => createApiCoreDdb({ documentClient })
        });
    }
});
