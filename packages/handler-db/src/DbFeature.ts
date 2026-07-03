import { createFeature } from "@webiny/feature/api";
import { Db } from "@webiny/db";
import { DynamoDbDriver, DynamoDBClientFeature, FilterUtilFeature } from "@webiny/db-dynamodb";
import { ValueFilterFeature } from "@webiny/db-utils";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
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

        const EMPTY_SCHEMA = makeExecutableSchema({
            typeDefs: "type Query\ntype Mutation",
            assumeValidSDL: true
        });
        container.registerInstance(GraphQLContextualSchema, {
            async build(ctx: Record<string, any>) {
                ctx.db = db;
                return EMPTY_SCHEMA;
            }
        });
    }
});
