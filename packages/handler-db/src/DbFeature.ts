import { createFeature } from "@webiny/feature/api";
import { Db } from "@webiny/db";
import { DynamoDbDriver, DynamoDBClientFeature, FilterUtilFeature } from "@webiny/db-dynamodb";
import { ValueFilterFeature } from "@webiny/db-utils";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
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

        // Register DynamoDBClient abstraction (Bruno's pattern: { client: DynamoDBDocument })
        DynamoDBClientFeature.register(container, config.documentClient);

        // DDB filter/query utilities — required for CMS entry filtering
        FilterUtilFeature.register(container);
        ValueFilterFeature.register(container);

        // Register the full Db instance for code that needs driver + key-value store
        container.registerInstance(DbInstance, db as Db<unknown>);

        // ctx.db bridge for legacy code that accesses context.db.driver.getClient() etc.
        container.registerInstance(GraphQLContextEnhancer, {
            enhance(ctx: Record<string, any>): void {
                ctx.db = db;
            }
        });
    }
});
