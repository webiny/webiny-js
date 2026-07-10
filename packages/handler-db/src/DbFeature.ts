import { createFeature } from "@webiny/feature/api";
import { Db } from "@webiny/db";
import { DynamoDbDriver, DynamoDBClientFeature, FilterUtilFeature } from "@webiny/db-dynamodb";
import { ValueFilterFeature } from "@webiny/db-utils";
import type { Container } from "@webiny/di";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { DbInstance } from "./abstractions.js";

export interface DbFeatureConfig {
    documentClient: DynamoDBDocument;
    table?: string;
}

export const DbFeature = createFeature({
    name: "Db",
    register(container: Container, config: DbFeatureConfig) {
        const driver = new DynamoDbDriver({ documentClient: config.documentClient });
        const db = new Db({ driver, table: config.table });

        // Raw DynamoDB document client abstraction ({ client: DynamoDBDocument }) — the DI-native
        // replacement for the old `context.db.driver.getClient()`.
        DynamoDBClientFeature.register(container, config.documentClient);

        // DDB filter/query utilities — required for CMS entry filtering
        FilterUtilFeature.register(container);
        ValueFilterFeature.register(container);

        // Full Db instance (driver + key-value store) for code that needs it — the DI-native
        // replacement for `context.db`. Resolve via `DbInstance` instead of reading the context bag.
        container.registerInstance(DbInstance, db as Db<unknown>);
    }
});
