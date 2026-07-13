import { createFeature } from "@webiny/feature/api";
import { DynamoDBClientFeature, FilterUtilFeature } from "@webiny/db-dynamodb";
import { ValueFilterFeature } from "@webiny/db-utils";
import type { Container } from "@webiny/di";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface DbFeatureConfig {
    documentClient: DynamoDBDocument;
}

/**
 * Registers the DynamoDB document client abstraction + the DDB filter/query utilities that CMS entry
 * filtering depends on. It no longer registers a `Db`/`DbInstance` key-value store: that was the
 * DI-native `context.db` replacement and has no remaining consumers — the CMS delete-model store (its
 * last user) moved to the flavour-agnostic api-core key-value store.
 */
export const DbFeature = createFeature({
    name: "Db",
    register(container: Container, config: DbFeatureConfig) {
        // Raw DynamoDB document client abstraction ({ client: DynamoDBDocument }) — the DI-native
        // replacement for the old `context.db.driver.getClient()`.
        DynamoDBClientFeature.register(container, config.documentClient);

        // DDB filter/query utilities — required for CMS entry filtering.
        FilterUtilFeature.register(container);
        ValueFilterFeature.register(container);
    }
});
