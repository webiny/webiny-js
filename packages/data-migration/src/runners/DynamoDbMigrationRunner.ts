import { Table, Entity } from "dynamodb-toolbox";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { dynamoDbUtils } from "~/utils/dynamoDb";
import { DataMigration, DynamoDbMigrationContext, EntityParams } from "~/types";
import { DynamoDbDataMigration } from "~/migrations/DynamoDbDataMigration";
import { AbstractDataMigrationRunner } from "~/runners/AbstractDataMigrationRunner";

interface DynamoDbMigrationRunnerConfig {
    table: Table;
    documentClient: DocumentClient;
}

export class DynamoDbMigrationRunner extends AbstractDataMigrationRunner<DynamoDbMigrationContext> {
    private readonly config: DynamoDbMigrationRunnerConfig;

    constructor(config: DynamoDbMigrationRunnerConfig) {
        super();
        this.config = config;
    }

    override getName(): string {
        return "dynamodb-migration-runner";
    }

    override canExecute(migration: DataMigration<DynamoDbMigrationContext>): boolean {
        return migration instanceof DynamoDbDataMigration;
    }

    override getMigrationContext(): DynamoDbMigrationContext {
        return {
            table: this.config.table,
            documentClient: this.config.documentClient,
            dynamoDbUtils,
            createEntity: (params: EntityParams) => {
                return new Entity({
                    table: this.config.table,
                    name: params.name,
                    attributes: params.attributes
                });
            }
        };
    }
}
