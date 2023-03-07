import { Table } from "dynamodb-toolbox";
import { createRawEventHandler } from "@webiny/handler-aws";
import { Constructor, createContainer } from "@webiny/ioc";
import { IsMigrationApplicable, MigrationRunner } from "~/MigrationRunner";
import { MigrationRepositorySymbol, MigrationSymbol, PrimaryDynamoTableSymbol } from "~/symbols";
import { MigrationRepositoryImpl } from "~/repository/migrations.repository";
import { devVersionErrorResponse } from "./devVersionErrorResponse";
import { createPatternMatcher } from "./createPatternMatcher";
import {
    DataMigration,
    MigrationEventHandlerResponse,
    MigrationEventPayload,
    MigrationRepository
} from "~/types";

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
    return createRawEventHandler<MigrationEventPayload, any, MigrationEventHandlerResponse>(
        async ({ payload }) => {
            const projectVersion = String(payload?.version || process.env.WEBINY_VERSION);

            if (projectVersion === "0.0.0") {
                return devVersionErrorResponse();
            }

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

            // If handler was invoked with a `pattern`, filter migrations that match the pattern only.
            let patternMatcher;
            if (payload.pattern) {
                patternMatcher = createPatternMatcher(payload.pattern);
            }

            // Inject dependencies and execute.
            try {
                const data = await container
                    .resolve(MigrationRunner)
                    .execute(projectVersion, patternMatcher || isMigrationApplicable);

                return { data };
            } catch (err) {
                return { error: { message: err.message } };
            }
        }
    );
};
