import { ElasticsearchDataMigration } from "~/migrations/ElasticsearchDataMigration";
import { DataMigration, ElasticsearchMigrationContext, WithLog } from "~/types";

export const createEsMigration = (id: string, opts = { error: false }): DataMigration<any> => {
    class MigrationImpl extends ElasticsearchDataMigration {
        execute(context: WithLog<ElasticsearchMigrationContext>): Promise<void> {
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

        shouldExecute(context: WithLog<ElasticsearchMigrationContext>): Promise<boolean> {
            return Promise.resolve(true);
        }
    }

    return new MigrationImpl();
};
