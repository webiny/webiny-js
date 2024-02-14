import { Table } from "@webiny/db-dynamodb/toolbox";
import { Client } from "@elastic/elasticsearch";
import {
    DataMigration,
    DataMigrationContext,
    ElasticsearchClientSymbol,
    ElasticsearchDynamoTableSymbol,
    getChildLogger,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { makeInjectable, inject } from "@webiny/ioc";
import { FormBuilder_5_40_0_002_FormSubmissions } from "~/migrations/5.40.0/002/ddb-es/FormSubmissionsMigration";
export * from "../types";

export class FormBuilder_5_40_0_002 implements DataMigration {
    private migrations: DataMigration[];

    constructor(
        table: Table<string, string, string>,
        esTable: Table<string, string, string>,
        elasticsearchClient: Client
    ) {
        this.migrations = [
            new FormBuilder_5_40_0_002_FormSubmissions(table, esTable, elasticsearchClient)
        ];
    }

    getId(): string {
        return "5.40.0-002";
    }

    getDescription(): string {
        return "Upgrade Form Builder (submissions) to use HCMS storage operations.";
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

makeInjectable(FormBuilder_5_40_0_002, [
    inject(PrimaryDynamoTableSymbol),
    inject(ElasticsearchDynamoTableSymbol),
    inject(ElasticsearchClientSymbol)
]);
