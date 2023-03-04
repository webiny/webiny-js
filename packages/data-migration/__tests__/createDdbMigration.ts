import { Table } from "dynamodb-toolbox";
import { makeInjectable, inject, Constructor } from "@webiny/ioc";
import { DataMigration, Logger, PrimaryDynamoTableSymbol } from "~/index";

export const createDdbMigration = (
    id: string,
    opts = { error: false }
): Constructor<DataMigration> => {
    class DynamoDbMigration implements DataMigration {
        private readonly table: Table;

        constructor(table: Table) {
            this.table = table;
        }

        execute(logger: Logger): Promise<void> {
            logger.info(`Migrating stuff...`, { id });
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
            return Promise.resolve(true);
        }
    }

    makeInjectable(DynamoDbMigration, [inject(PrimaryDynamoTableSymbol)]);

    return DynamoDbMigration;
};
