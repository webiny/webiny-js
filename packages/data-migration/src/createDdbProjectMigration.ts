import { Table } from "dynamodb-toolbox";
import { createRawEventHandler } from "@webiny/handler-aws";
import { Constructor, createContainer } from "@webiny/ioc";
import { DataMigration, MigrationEventHandlerResponse, MigrationRepository } from "~/types";
import { IsMigrationApplicable, MigrationRunner } from "~/MigrationRunner";
import { MigrationRepositorySymbol, PrimaryDynamoTableSymbol } from "~/symbols";
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

        // Resolve the provided migrations.
        const resolvedMigrations = migrations.map(migration => container.resolve(migration));

        // Inject dependencies and execute.
        try {
            const data = await container
                .resolve(MigrationRunner)
                .execute(resolvedMigrations, isMigrationApplicable);

            return { data };
        } catch (err) {
            return { error: { message: err.message } };
        }
    });
};
