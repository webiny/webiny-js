import { Table } from "@webiny/db-dynamodb/toolbox";
import { inject, makeInjectable } from "@webiny/ioc";
import {
    DataMigration,
    DataMigrationContext,
    getChildLogger,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { AcoRecords_5_37_0_004_PageData } from "./PageDataMigration";

export class AcoRecords_5_37_0_004 implements DataMigration {
    private readonly migrations: DataMigration[];

    public constructor(table: Table<string, string, string>) {
        this.migrations = [new AcoRecords_5_37_0_004_PageData(table)];
    }

    public getId() {
        return "5.37.0-004";
    }

    public getDescription() {
        return "Page Builder Pages search record migration";
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

makeInjectable(AcoRecords_5_37_0_004, [inject(PrimaryDynamoTableSymbol)]);
