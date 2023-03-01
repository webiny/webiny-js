import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Client } from "@elastic/elasticsearch";
import { Table, Entity } from "dynamodb-toolbox";
import { EntityAttributes } from "dynamodb-toolbox/dist/classes/Entity";
import { dynamoDbUtils } from "./utils/dynamoDb";
export { MigrationEventHandlerResponse } from "./createMigrationEventHandler";

export interface MigrationItem {
    id: string;
    name: string;
    createdOn: string;
    duration: number;
    logs: Log[];
}

export interface MigrationRepository {
    listMigrations(params?: { limit: number }): Promise<MigrationItem[]>;
    logMigration(migration: MigrationItem): Promise<void>;
}

export type WithLog<T> = T & { log: (message: string, data?: any) => void };

/**
 * Implement this interface for DDB migrations.
 */
export interface DataMigration<TContext> {
    getId(): string;
    getName(): string;
    // This function should check of the migration needs to apply some changes to the system.
    // Returning `false` means "everything is ok, mark this migration as executed".
    shouldExecute(context: WithLog<TContext>): Promise<boolean>;
    execute(context: WithLog<TContext>): Promise<void>;
}

export interface DataMigrationRunner<TContext> {
    canExecute(migration: DataMigration<TContext>): boolean;
    execute(migration: DataMigration<TContext>): Promise<MigrationResult>;
}

export interface EntityParams {
    name: string;
    attributes: EntityAttributes;
}

interface Log {
    message: string;
    data?: any;
}

export interface MigrationResult {
    success: boolean;
    logs: Log[];
    duration: number;
    runner: string;
}

export interface DynamoDbMigrationContext {
    // Primary DynamoDB table
    table: Table;
    // Entity factory
    createEntity(params: EntityParams): Entity<any>;
    // DocumentClient instance
    documentClient: DocumentClient;
    // Various tools to write migrations for DynamoDB
    dynamoDbUtils: typeof dynamoDbUtils;
}

export interface ElasticsearchMigrationContext extends DynamoDbMigrationContext {
    // Dynamo-to-Elastic DynamoDB table
    table: Table;
    // Elasticsearch client instance
    elasticsearchClient: Client;
}
