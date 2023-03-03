import { Entity, Table } from "dynamodb-toolbox";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Client as ElasticsearchClient } from "@elastic/elasticsearch";
import { dynamoDbUtils } from "~/utils/dynamoDb";
import { DataMigration, ElasticsearchMigrationContext, EntityParams } from "~/types";
import { AbstractDataMigrationRunner } from "~/runners/AbstractDataMigrationRunner";
import { ElasticsearchDataMigration } from "~/migrations/ElasticsearchDataMigration";

interface ElasticsearchMigrationRunnerConfig {
    table: Table;
    documentClient: DocumentClient;
    elasticsearchClient: ElasticsearchClient;
}

export class ElasticsearchMigrationRunner extends AbstractDataMigrationRunner<ElasticsearchMigrationContext> {
    private readonly config: ElasticsearchMigrationRunnerConfig;

    constructor(config: ElasticsearchMigrationRunnerConfig) {
        super();
        this.config = config;
    }

    override getName(): string {
        return "elasticsearch-migration-runner";
    }

    override canExecute(migration: DataMigration<ElasticsearchMigrationContext>): boolean {
        return migration instanceof ElasticsearchDataMigration;
    }

    override getMigrationContext(): ElasticsearchMigrationContext {
        return {
            table: this.config.table,
            documentClient: this.config.documentClient,
            dynamoDbUtils,
            elasticsearchClient: this.config.elasticsearchClient,
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
