import { Client as ElasticsearchClient } from "@elastic/elasticsearch";
import { Table } from "dynamodb-toolbox";
import { createRawEventHandler } from "@webiny/handler-aws";
import { createContainer, Constructor } from "@webiny/ioc";
import {
    DataMigration,
    MigrationEventHandlerResponse,
    MigrationEventPayload,
    MigrationRepository
} from "~/types";
import {
    ElasticsearchClientSymbol,
    MigrationRepositorySymbol,
    PrimaryDynamoTableSymbol,
    ElasticsearchDynamoTableSymbol,
    MigrationSymbol
} from "~/symbols";
import { IsMigrationApplicable, MigrationRunner } from "~/MigrationRunner";
import { MigrationRepositoryImpl } from "~/repository/migrations.repository";
import { devVersionErrorResponse } from "~/handlers/devVersionErrorResponse";
import { createPatternMatcher } from "~/handlers/createPatternMatcher";

interface CreateDdbEsDataMigrationConfig {
    elasticsearchClient: ElasticsearchClient;
    primaryTable: Table;
    dynamoToEsTable: Table;
    migrations: Constructor<DataMigration>[];
    isMigrationApplicable?: IsMigrationApplicable;
    repository?: MigrationRepository;
}

export const createDdbEsProjectMigration = ({
    migrations,
    elasticsearchClient,
    primaryTable,
    dynamoToEsTable,
    isMigrationApplicable = undefined,
    repository = undefined
}: CreateDdbEsDataMigrationConfig) => {
    return createRawEventHandler<MigrationEventPayload, any, MigrationEventHandlerResponse>(
        async ({ payload }) => {
            const projectVersion = String(payload?.version || process.env.WEBINY_VERSION);

            if (projectVersion === "0.0.0") {
                return devVersionErrorResponse();
            }

            // COMPOSITION ROOT
            const container = createContainer();
            container.bind(PrimaryDynamoTableSymbol).toConstantValue(primaryTable);
            container.bind(ElasticsearchDynamoTableSymbol).toConstantValue(dynamoToEsTable);
            container.bind(ElasticsearchClientSymbol).toConstantValue(elasticsearchClient);

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
