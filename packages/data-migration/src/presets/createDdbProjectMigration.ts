import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table } from "dynamodb-toolbox";
import { DataMigration } from "~/types";
import { DynamoDbMigrationRunner } from "~/runners/DynamoDbMigrationRunner";
import { createMigrationEventHandler } from "~/createMigrationEventHandler";
import { createMigrationsRepository } from "~/repository/migrations.repository";

interface CreateDdbDataMigrationConfig {
    documentClient: DocumentClient;
    table: Table;
    migrations: DataMigration<any>[];
}

export const createDdbProjectMigration = ({
    migrations,
    documentClient,
    table
}: CreateDdbDataMigrationConfig) => {
    return createMigrationEventHandler({
        repository: createMigrationsRepository(table),
        migrations,
        runners: [new DynamoDbMigrationRunner({ table, documentClient })]
    });
};
