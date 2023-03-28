import { Table, Entity } from "dynamodb-toolbox";
import { queryAll, queryOne } from "@webiny/db-dynamodb/utils/query";
import { MigrationItem, MigrationRepository, MigrationRun } from "~/types";
import { inject, makeInjectable } from "@webiny/ioc";
import { PrimaryDynamoTableSymbol } from "~/symbols";
import { createStandardEntity } from "./createStandardEntity";

export class MigrationRepositoryImpl implements MigrationRepository {
    private readonly run: Entity<any>;
    private readonly migration: Entity<any>;
    private readonly checkpoint: Entity<any>;

    constructor(table: Table) {
        this.run = createStandardEntity({ table, name: "MigrationRun" });
        this.migration = createStandardEntity({ table, name: "Migration" });
        this.checkpoint = createStandardEntity({ table, name: "MigrationCheckpoint" });
    }

    async getLastRun(): Promise<MigrationRun | null> {
        const result = await queryOne<{ data: MigrationRun }>({
            entity: this.run,
            partitionKey: "MIGRATION_RUNS",
            options: {
                index: "GSI1",
                gt: " ",
                reverse: true
            }
        });

        return result ? result.data : null;
    }

    async saveRun(run: MigrationRun): Promise<void> {
        await this.run.put({
            PK: `MIGRATION_RUN#${run.startedOn}`,
            SK: "A",
            TYPE: "migration.run",
            GSI1_PK: "MIGRATION_RUNS",
            GSI1_SK: run.startedOn,
            data: run
        });
    }

    async listMigrations(params?: { limit: number }): Promise<MigrationItem[]> {
        const { limit } = params || {};
        const result = await queryAll<{ data: MigrationItem }>({
            entity: this.migration,
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
            data
        });
    }

    deleteCheckpoint(id: string): Promise<void> {
        return this.checkpoint.delete({
            PK: `MIGRATION_CHECKPOINT#${id}`,
            SK: "A"
        });
    }

    async getCheckpoint(id: string): Promise<unknown | null> {
        const record = await this.checkpoint.get({
            PK: `MIGRATION_CHECKPOINT#${id}`,
            SK: "A"
        });

        if (!record || !record.Item) {
            return null;
        }
        return record.Item.data;
    }
}

makeInjectable(MigrationRepositoryImpl, [inject(PrimaryDynamoTableSymbol)]);
