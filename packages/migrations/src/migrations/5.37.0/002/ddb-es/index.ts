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
import { AcoRecords_5_37_0_002_AcoFolder } from "./AcoFolderMigration";

export * from "../types";

export class AcoFolders_5_37_0_002 implements DataMigration {
    private readonly migrations: DataMigration[];

    constructor(table: Table, esTable: Table, elasticsearchClient: Client) {
        this.migrations = [
            new AcoRecords_5_37_0_002_AcoFolder(table, esTable, elasticsearchClient)
        ];
    }

    getId(): string {
        return "5.37.0-002";
    }

    getDescription(): string {
        return "ACO Folder parentId migration";
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

makeInjectable(AcoFolders_5_37_0_002, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
