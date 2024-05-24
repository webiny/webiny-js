import { CliContext } from "@webiny/cli/types";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { createPinoLogger, getLogLevel } from "@webiny/logger";
import pinoPretty from "pino-pretty";
import { MetaFieldsMigrationParams, MetaFieldsMigration } from "~/migrations/5.39.6/001/ddb-es/MetaFieldsMigration";

interface CoreOutput {
    primaryDynamodbTableName: string;
    elasticsearchDynamodbTableName: string;
    elasticsearchDomainEndpoint: string;
}

const REQUIRED_AWS_ENV_VARS = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_SESSION_TOKEN"
];

const ensureAwsEnvVars = () => {
    const missingAwsEnvVars = [];
    for (const variable of REQUIRED_AWS_ENV_VARS) {
        if (!process.env[variable]) {
            missingAwsEnvVars.push(variable);
        }
    }

    if (missingAwsEnvVars.length > 0) {
        throw new Error(
            `Cannot run 5.39.6 meta fields data migration. Missing required environment variables: ${missingAwsEnvVars.join(
                ", "
            )}.`
        );
    }
};

/**
 * Creates an after-deployment hook that triggers the meta fields data migration.
 * @param params
 */
export const createMetaFieldsDataMigrationDeploymentHook = (
    params: Pick<MetaFieldsMigrationParams, "totalSegments" | "esHealthChecks">
) => {
    return {
        type: "hook-after-deploy",
        name: "hook-after-deploy-api-run-5-39-6-meta-fields-data-migrations",
        async hook({ inputs, env, projectApplication }: Record<string, any>, context: CliContext) {
            // Only run migrations for `api` app
            if (projectApplication.id !== "api") {
                return;
            }

            // No need to run migrations if we're doing a preview.
            if (inputs.preview) {
                return;
            }

            if (process.env.WEBINY_MIGRATION_RUN_5_39_6_META_FIELDS_DATA_MIGRATIONS !== "true") {
                context.info(
                    `Skipping meta fields data migration. Set %s to %s to enable.`,
                    "WEBINY_MIGRATION_RUN_5_39_6_META_FIELDS_DATA_MIGRATIONS",
                    "true"
                );
                return;
            }

            ensureAwsEnvVars();

            const coreOutput = getStackOutput<CoreOutput>({ folder: "apps/core", env });

            context.info("Executing 5.39.6-001 meta fields data migration...");

            const logger = createPinoLogger(
                {
                    level: getLogLevel(process.env.MIGRATIONS_LOG_LEVEL, "trace")
                },
                pinoPretty({ ignore: "pid,hostname" })
            );

            const migration = new MetaFieldsMigration({
                ddbTable: coreOutput.primaryDynamodbTableName,
                ddbEsTable: coreOutput.elasticsearchDynamodbTableName,
                esEndpoint: coreOutput.elasticsearchDomainEndpoint,
                ...params,
                logger
            });

            await migration.execute();
        }
    };
};
