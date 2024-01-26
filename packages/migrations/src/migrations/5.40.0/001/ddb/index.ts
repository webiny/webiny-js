import { Table } from "@webiny/db-dynamodb/toolbox";
import {
    DataMigration,
    DataMigrationContext,
    getChildLogger,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { makeInjectable, inject } from "@webiny/ioc";
import { FormBuilder_5_40_0_001_FormLatest } from "./FormLatestMigration";
import { FormBuilder_5_40_0_001_FormPublished } from "./FormPublishedMigration";
import { FormBuilder_5_40_0_001_FormRevisions } from "./FormRevisionsMigration";
import { FormBuilder_5_40_0_001_FormStats } from "./FormStatsMigration";
import { FormBuilder_5_40_0_001_FormSubmissions } from "~/migrations/5.40.0/001/ddb/FormSubmissionsMigration";

export class FormBuilder_5_40_0_001 implements DataMigration {
    private migrations: DataMigration[];

    constructor(table: Table<string, string, string>) {
        this.migrations = [
            new FormBuilder_5_40_0_001_FormRevisions(table),
            new FormBuilder_5_40_0_001_FormPublished(table),
            new FormBuilder_5_40_0_001_FormLatest(table),
            new FormBuilder_5_40_0_001_FormStats(table),
            new FormBuilder_5_40_0_001_FormSubmissions(table)
        ];
    }

    getId(): string {
        return "5.40.0-001";
    }

    getDescription(): string {
        return "Upgrade Form Builder to use HCMS storage operations.";
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

makeInjectable(FormBuilder_5_40_0_001, [inject(PrimaryDynamoTableSymbol)]);
