import { Table } from "@webiny/db-dynamodb/toolbox";
import { Client } from "@elastic/elasticsearch";
import {
    DataMigration,
    DataMigrationContext,
    ElasticsearchClientSymbol,
    getChildLogger,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { makeInjectable, inject } from "@webiny/ioc";
import { FileManager_5_35_0_001_FileData } from "./FileDataMigration";
import { FileManager_5_35_0_001_FileManagerSettings } from "../FileSettingsMigration";
export * from "../types";

export class FileManager_5_35_0_001 implements DataMigration {
    private migrations: DataMigration[];

    constructor(table: Table<string, string, string>, elasticsearchClient: Client) {
        this.migrations = [
            new FileManager_5_35_0_001_FileData(table, elasticsearchClient),
            new FileManager_5_35_0_001_FileManagerSettings(table)
        ];
    }

    getId(): string {
        return "5.35.0-001";
    }

    getDescription(): string {
        return "Upgrade File Manager to use better PKs and `data` envelope.";
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

makeInjectable(FileManager_5_35_0_001, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
