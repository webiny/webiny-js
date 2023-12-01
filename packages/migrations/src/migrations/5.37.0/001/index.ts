import { Table } from "@webiny/db-dynamodb/toolbox";
import { makeInjectable, inject } from "@webiny/ioc";
import {
    DataMigration,
    DataMigrationContext,
    getChildLogger,
    PrimaryDynamoTableSymbol
} from "@webiny/data-migration";
import { TenantLinkRecords_5_37_0_001_FileData } from "./TenantLinkDataMigration";

export class TenantLinkRecords_5_37_0_001 implements DataMigration {
    private migrations: DataMigration[];

    public constructor(table: Table<string, string, string>) {
        this.migrations = [new TenantLinkRecords_5_37_0_001_FileData(table)];
    }

    public getId() {
        return "5.37.0-001";
    }

    public getDescription() {
        return "Migrate Tenant Links Data";
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

makeInjectable(TenantLinkRecords_5_37_0_001, [inject(PrimaryDynamoTableSymbol)]);
