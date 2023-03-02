import { DataMigration, DynamoDbMigrationContext, WithLog } from "~/types";

export abstract class DynamoDbDataMigration implements DataMigration<DynamoDbMigrationContext> {
    abstract getId(): string;

    abstract getName(): string;

    abstract shouldExecute(context: WithLog<DynamoDbMigrationContext>): Promise<boolean>;

    abstract execute(context: WithLog<DynamoDbMigrationContext>): Promise<void>;
}
