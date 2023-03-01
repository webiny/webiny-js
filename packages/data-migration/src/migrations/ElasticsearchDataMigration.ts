import { DataMigration, ElasticsearchMigrationContext, WithLog } from "~/types";

export abstract class ElasticsearchDataMigration
    implements DataMigration<ElasticsearchMigrationContext>
{
    abstract getId(): string;

    abstract getName(): string;

    abstract shouldExecute(context: WithLog<ElasticsearchMigrationContext>): Promise<boolean>;

    abstract execute(context: WithLog<ElasticsearchMigrationContext>): Promise<void>;
}
