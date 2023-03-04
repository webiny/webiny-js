import { Table } from "dynamodb-toolbox";
import { createRawEventHandler } from "@webiny/handler-aws";
import { Constructor, createContainer } from "@webiny/ioc";
import { DataMigration, MigrationEventHandlerResponse, MigrationRepository } from "~/types";
import { IsMigrationApplicable, MigrationRunner } from "~/MigrationRunner";
import { MigrationRepositorySymbol, MigrationSymbol, PrimaryDynamoTableSymbol } from "~/symbols";
import { MigrationRepositoryImpl } from "~/repository/migrations.repository";

interface CreateDdbDataMigrationConfig {
    migrations: Constructor<DataMigration>[];
    primaryTable: Table;
    repository?: MigrationRepository;
    isMigrationApplicable?: IsMigrationApplicable;
}

export const createDdbProjectMigration = ({
    migrations,
    primaryTable,
    isMigrationApplicable = undefined,
    repository = undefined
}: CreateDdbDataMigrationConfig) => {
    return createRawEventHandler<any, any, MigrationEventHandlerResponse>(async () => {
        // COMPOSITION ROOT
        const container = createContainer();
        container.bind(PrimaryDynamoTableSymbol).toConstantValue(primaryTable);

        if (repository) {
            // Repository implementation provided by the user.
            container.bind(MigrationRepositorySymbol).toConstantValue(repository);
        } else {
            // Default repository implementation.
            container.bind(MigrationRepositorySymbol).to(MigrationRepositoryImpl);
        }

        // Bind the provided migrations.
        migrations.forEach(migration => container.bind(MigrationSymbol).to(migration));

        // Inject dependencies and execute.
        try {
            const data = await container
                .resolve(MigrationRunner)
                .execute(String(process.env.WEBINY_VERSION), isMigrationApplicable);

            return { data };
        } catch (err) {
            return { error: { message: err.message } };
        }
    });
};
