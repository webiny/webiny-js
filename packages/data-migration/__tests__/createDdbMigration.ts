import type { Table } from "@webiny/db-dynamodb/toolbox";
import type { Constructor } from "@webiny/ioc";
import { makeInjectable, inject } from "@webiny/ioc";
import type { DataMigration } from "~/index";
import { PrimaryDynamoTableSymbol } from "~/symbols";

export const createDdbMigration = (
    id: string,
    opts: { error?: boolean; skip?: boolean } = { error: false, skip: false }
): Constructor<DataMigration> => {
    class DynamoDbMigration implements DataMigration {
        private readonly table: Table<string, string, string>;

        constructor(table: Table<string, string, string>) {
            this.table = table;
        }

        execute(): Promise<void> {
            console.info(`Migrating stuff...`, { id });
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
