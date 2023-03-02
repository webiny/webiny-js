import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Client as ElasticsearchClient } from "@elastic/elasticsearch";
import { Table } from "dynamodb-toolbox";
import { DataMigration } from "~/types";
import { DynamoDbMigrationRunner } from "~/runners/DynamoDbMigrationRunner";
import { ElasticsearchMigrationRunner } from "~/runners/ElasticsearchMigrationRunner";
import { createMigrationEventHandler } from "~/createMigrationEventHandler";
import { createMigrationsRepository } from "~/repository/migrations.repository";

interface CreateDdbEsDataMigrationConfig {
    documentClient: DocumentClient;
    elasticsearchClient: ElasticsearchClient;
    primaryTable: Table;
    dynamoToEsTable: Table;
    migrations: DataMigration<any>[];
}

export const createDdbEsProjectMigration = ({
    migrations,
    elasticsearchClient,
    documentClient,
    primaryTable,
    dynamoToEsTable
}: CreateDdbEsDataMigrationConfig) => {
    return createMigrationEventHandler({
        repository: createMigrationsRepository(primaryTable),
        migrations,
        runners: [
            new DynamoDbMigrationRunner({ table: primaryTable, documentClient }),
            new ElasticsearchMigrationRunner({
                table: dynamoToEsTable,
                documentClient,
                elasticsearchClient
            })
        ]
    });
};
