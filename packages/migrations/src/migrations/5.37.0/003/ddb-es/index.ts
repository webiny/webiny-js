import { Table } from "dynamodb-toolbox";
import { Client } from "@elastic/elasticsearch";
import {
    DataMigration,
    DataMigrationContext,
    ElasticsearchClientSymbol,
    ElasticsearchDynamoTableSymbol,
    getChildLogger,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { inject, makeInjectable } from "@webiny/ioc";
import { AcoRecords_5_37_0_003_PageData } from "./PageDataMigration";

export * from "../types";

export class AcoRecords_5_37_0_003 implements DataMigration {
    private readonly migrations: DataMigration[];

    constructor(table: Table, esTable: Table, elasticsearchClient: Client) {
        this.migrations = [new AcoRecords_5_37_0_003_PageData(table, esTable, elasticsearchClient)];
    }

    getId(): string {
        return "5.37.0-003";
    }

    getDescription(): string {
        return "Page Builder Pages search record migration";
    }

    async shouldExecute(context: DataMigrationContext): Promise<boolean> {
        for (const migration of this.migrations) {
            const childLogger = getChildLogger(context.logger, migration);
            const childContext = { ...context, logger: childLogger };
            if (await migration.shouldExecute(childContext)) {
                return true;
            }
        }
        return false;
    }

    async execute(context: DataMigrationContext): Promise<void> {
        for (const migration of this.migrations) {
            const childLogger = getChildLogger(context.logger, migration);
            const childContext = { ...context, logger: childLogger };
            if (await migration.shouldExecute(childContext)) {
                await migration.execute(childContext);
            }
        }
    }
}

makeInjectable(AcoRecords_5_37_0_003, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
