import { Table } from "@webiny/db-dynamodb/toolbox";
import { makeInjectable, inject, Constructor } from "@webiny/ioc";
import { DataMigration, DataMigrationContext, PrimaryDynamoTableSymbol } from "~/index";

export const createDdbMigration = (
    id: string,
    opts: { error?: boolean; skip?: boolean } = { error: false, skip: false }
): Constructor<DataMigration> => {
    class DynamoDbMigration implements DataMigration {
        private readonly table: Table<string, string, string>;

        constructor(table: Table<string, string, string>) {
            this.table = table;
        }

        execute(context: DataMigrationContext): Promise<void> {
            context.logger.info(`Migrating stuff...`, { id });
            if (opts.error) {
                throw Error(`Something went wrong in ${id}`);
            }
            return Promise.resolve(undefined);
        }

        getId(): string {
            return id;
        }

        getDescription(): string {
            return id;
        }

        shouldExecute(): Promise<boolean> {
            return Promise.resolve(!opts.skip);
        }
    }

    makeInjectable(DynamoDbMigration, [inject(PrimaryDynamoTableSymbol)]);

    return DynamoDbMigration;
};
