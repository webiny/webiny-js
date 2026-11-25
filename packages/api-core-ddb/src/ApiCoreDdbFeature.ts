import { createFeature } from "@webiny/feature/api";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { ApiCoreStorageOperationsFactory, TenancyStorageOperationsFactory } from "@webiny/api-core";
import { createApiCoreDdb } from "./createApiCoreDdb.js";
import { createStorageOperations as createTenancyStorageOperations } from "./tenancy/index.js";

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
            create: ({ scopeTenant }) => createApiCoreDdb({ documentClient, scopeTenant })
        });
        // The tenant registry on its own: the request container reads the request's tenant from it.
        container.registerInstance(TenancyStorageOperationsFactory, {
            create: () => createTenancyStorageOperations({ documentClient })
        });
    }
});
