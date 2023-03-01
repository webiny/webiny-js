import { Table, Entity } from "dynamodb-toolbox";
import { MigrationItem, MigrationRepository } from "~/types";
import { createMigrationsEntity } from "~/repository/migrations.entity";
import { dynamoDbUtils } from "~/utils/dynamoDb";

class MigrationRepositoryImpl implements MigrationRepository {
    private readonly entity: Entity<any>;

    constructor(table: Table) {
        this.entity = createMigrationsEntity({ table });
    }

    async listMigrations(params?: { limit: number }): Promise<MigrationItem[]> {
        const { limit } = params || {};
        const result = await dynamoDbUtils.queryAll<{ data: MigrationItem }>({
            entity: this.entity,
            partitionKey: "MIGRATIONS",
            options: {
                index: "GSI1",
                gt: " ",
                limit,
                // Sort by GSI1_SK
                reverse: true
            }
        });

        return result.map(item => item.data);
    }

    async logMigration(migration: MigrationItem): Promise<void> {
        await this.entity.put({
            PK: `MIGRATION#${migration.id}`,
            SK: "A",
            TYPE: "migration",
            GSI1_PK: "MIGRATIONS",
            GSI1_SK: migration.id,
            data: migration
        });
    }
}

export const createMigrationsRepository = (table: Table) => {
    return new MigrationRepositoryImpl(table);
};
