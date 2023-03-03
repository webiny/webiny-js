import { DynamoDbDataMigration, DynamoDbMigrationContext, WithLog } from "@webiny/data-migration";

export class FileManager_5_35_0_001 extends DynamoDbDataMigration {
    getId() {
        return "5.35.0-001";
    }
    getName() {
        return "Upgrade file manager partition keys, and use GSI1 for listing";
    }
    async shouldExecute(context: WithLog<DynamoDbMigrationContext>): Promise<boolean> {
        // TODO: check if files are already migrated
        context.log("Checking if migration is necessary...");
        return true;
    }
    async execute(context: WithLog<DynamoDbMigrationContext>): Promise<void> {
        context.log("Upgrading File Manager PKs");
    }
}
