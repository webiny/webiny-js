import { Table } from "@webiny/db-dynamodb/toolbox";
import { Client } from "@elastic/elasticsearch";
import {
    DataMigration,
    DataMigrationContext,
    ElasticsearchClientSymbol,
    ElasticsearchDynamoTableSymbol,
    getChildLogger,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { makeInjectable, inject } from "@webiny/ioc";
import { AcoRecords_5_36_0_001_FileData } from "./FileDataMigration";
export * from "../types";

export class AcoRecords_5_36_0_001 implements DataMigration {
    private migrations: DataMigration[];

    constructor(
        table: Table<string, string, string>,
        esTable: Table<string, string, string>,
        elasticsearchClient: Client
    ) {
        this.migrations = [new AcoRecords_5_36_0_001_FileData(table, esTable, elasticsearchClient)];
    }

    getId(): string {
        return "5.36.0-001";
    }

    getDescription(): string {
        return "Migrate FmFile Data -> Create ACO Search Records";
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

makeInjectable(AcoRecords_5_36_0_001, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
