import { Table } from "@webiny/db-dynamodb/toolbox";
import { makeInjectable, inject } from "@webiny/ioc";
import {
    DataMigration,
    DataMigrationContext,
    getChildLogger,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { AcoRecords_5_35_0_006_PageData } from "./PageDataMigration";

export class AcoRecords_5_35_0_006 implements DataMigration {
    private migrations: DataMigration[];

    public constructor(table: Table<string, string, string>) {
        this.migrations = [new AcoRecords_5_35_0_006_PageData(table)];
    }

    public getId() {
        return "5.35.0-006";
    }

    public getDescription() {
        return "ACO search record migration";
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

makeInjectable(AcoRecords_5_35_0_006, [inject(PrimaryDynamoTableSymbol)]);
