import type { Table } from "@webiny/db-dynamodb/toolbox.js";
import type { MigrationItem, MigrationRepository, MigrationRun } from "~/types.js";
import { inject, makeInjectable } from "@webiny/ioc";
import { PrimaryDynamoTableSymbol } from "~/symbols.js";
import { createGlobalEntity } from "@webiny/db-dynamodb";

interface MigrationCheckpoint {
    data: unknown;
}

export class MigrationRepositoryImpl implements MigrationRepository {
    private readonly run;
    private readonly migration;
    private readonly checkpoint;

    constructor(table: Table<string, string, string>) {
        this.run = createGlobalEntity<MigrationRun>({
            table,
            name: "MigrationRun"
        });
        this.migration = createGlobalEntity<MigrationItem>({
            table,
            name: "Migration"
        });
        this.checkpoint = createGlobalEntity<MigrationCheckpoint>({
            table,
            name: "MigrationCheckpoint"
        });
    }

    async getLastRun(): Promise<MigrationRun | null> {
        const result = await this.run.queryOne({
            partitionKey: "MIGRATION_RUNS",
            options: {
                index: "GSI1",
                gt: " ",
                reverse: true
            }
        });

        return result?.data || null;
    }

    async saveRun(run: MigrationRun): Promise<void> {
        await this.run.put({
            PK: `MIGRATION_RUN#${run.id}`,
            SK: "A",
            TYPE: "migration.run",
            GSI1_PK: "MIGRATION_RUNS",
            GSI1_SK: run.id,
            data: run
        });
    }

    async listMigrations(params?: { limit: number }): Promise<MigrationItem[]> {
        const { limit } = params || {};
        const result = await this.migration.queryAll({
            partitionKey: "MIGRATIONS",
            options: {
                index: "GSI1",
                gt: " ",
                limit,
                // Sort by GSI1_SK in descending order.
                reverse: true
            }
        });

        return result.map(item => item.data);
    }

    async logMigration(migration: MigrationItem): Promise<void> {
        await this.migration.put({
            PK: `MIGRATION#${migration.id}`,
            SK: "A",
            TYPE: "migration",
            GSI1_PK: "MIGRATIONS",
            GSI1_SK: migration.id,
            data: migration
        });
    }

    async createCheckpoint(id: string, data: unknown): Promise<void> {
        await this.checkpoint.put({
            PK: `MIGRATION_CHECKPOINT#${id}`,
            SK: "A",
            TYPE: "migration.checkpoint",
            GSI1_PK: "MIGRATION_CHECKPOINTS",
            GSI1_SK: id,
            data: data as MigrationCheckpoint
        });
    }

    async deleteCheckpoint(id: string): Promise<void> {
        await this.checkpoint.delete({
            PK: `MIGRATION_CHECKPOINT#${id}`,
            SK: "A"
        });
    }

    async getCheckpoint(id: string): Promise<unknown | null> {
        const record = await this.checkpoint.get({
            PK: `MIGRATION_CHECKPOINT#${id}`,
            SK: "A"
        });

        if (!record) {
            return null;
        }
        return record.data;
    }
}

makeInjectable(MigrationRepositoryImpl, [inject(PrimaryDynamoTableSymbol)]);
