import { DynamoDbDataMigration } from "~/migrations/DynamoDbDataMigration";
import { DataMigration, DynamoDbMigrationContext, WithLog } from "~/types";

export const createDdbMigration = (id: string, opts = { error: false }): DataMigration<any> => {
    class MigrationImpl extends DynamoDbDataMigration {
        execute(context: WithLog<DynamoDbMigrationContext>): Promise<void> {
            context.log(`Migrating stuff...`, { id });
            if (opts.error) {
                throw Error(`Something went wrong in ${id}`);
            }
            return Promise.resolve(undefined);
        }

        getId(): string {
            return id;
        }

        getName(): string {
            return id;
        }

        shouldExecute(context: WithLog<DynamoDbMigrationContext>): Promise<boolean> {
            return Promise.resolve(true);
        }
    }

    return new MigrationImpl();
};
