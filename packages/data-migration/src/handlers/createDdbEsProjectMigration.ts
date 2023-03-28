import { Client as ElasticsearchClient } from "@elastic/elasticsearch";
import { Table } from "dynamodb-toolbox";
import { createRawEventHandler } from "@webiny/handler-aws";
import { createContainer, Constructor } from "@webiny/ioc";
import {
    DataMigration,
    ExecutionTimeLimiter,
    MigrationEventHandlerResponse,
    MigrationEventPayload,
    MigrationRepository
} from "~/types";
import {
    ElasticsearchClientSymbol,
    MigrationRepositorySymbol,
    PrimaryDynamoTableSymbol,
    ElasticsearchDynamoTableSymbol,
    MigrationSymbol,
    ExecutionTimeLimiterSymbol
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
    timeLimiter?: ExecutionTimeLimiter;
}

export const createDdbEsProjectMigration = ({
    migrations,
    elasticsearchClient,
    primaryTable,
    dynamoToEsTable,
    isMigrationApplicable = undefined,
    repository = undefined,
    ...config
}: CreateDdbEsDataMigrationConfig) => {
    return createRawEventHandler<MigrationEventPayload, any, MigrationEventHandlerResponse>(
        async ({ payload, lambdaContext }) => {
            const projectVersion = String(payload?.version || process.env.WEBINY_VERSION);

            if (projectVersion === "0.0.0") {
                return devVersionErrorResponse();
            }

            // COMPOSITION ROOT
            const container = createContainer();
            container.bind(PrimaryDynamoTableSymbol).toConstantValue(primaryTable);
            container.bind(ElasticsearchDynamoTableSymbol).toConstantValue(dynamoToEsTable);
            container.bind(ElasticsearchClientSymbol).toConstantValue(elasticsearchClient);

            const timeLimiter: ExecutionTimeLimiter =
                config.timeLimiter || lambdaContext?.getRemainingTimeInMillis || (() => 0);
            container.bind(ExecutionTimeLimiterSymbol).toConstantValue(timeLimiter);

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
                const runner = await container.resolve(MigrationRunner);

                if (payload.command === "execute") {
                    await runner.execute(projectVersion, patternMatcher || isMigrationApplicable);
                    return;
                }

                return { data: await runner.getStatus() };
            } catch (err) {
                return { error: { message: err.message } };
            }
        }
    );
};
