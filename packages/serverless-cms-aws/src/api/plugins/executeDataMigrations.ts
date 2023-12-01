import { LambdaClient } from "@webiny/aws-sdk/client-lambda";
import { CliContext } from "@webiny/cli/types";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import {
    LogReporter,
    InteractiveCliStatusReporter,
    NonInteractiveCliStatusReporter,
    MigrationRunner,
    CliMigrationRunReporter
} from "@webiny/data-migration/cli";

/**
 * On every deployment of the API project application, this plugin invokes the data migrations Lambda.
 */
export const executeDataMigrations = {
    type: "hook-after-deploy",
    name: "hook-after-deploy-api-execute-data-migrations",
    async hook({ inputs, env, projectApplication }: Record<string, any>, context: CliContext) {
        // Only run migrations for `api` app
        if (projectApplication.id !== "api") {
            return;
        }

        if (inputs.build === false) {
            context.info(`"--no-build" argument detected - skipping data migrations.`);
            return;
        }

        // No need to run migrations if we're doing a preview.
        if (inputs.preview) {
            return;
        }

        const apiOutput = getStackOutput({ folder: "apps/api", env });

        context.info("Executing data migrations Lambda function...");

        try {
            const lambdaClient = new LambdaClient({
                region: apiOutput.region
            });

            const functionName = apiOutput["migrationLambdaArn"];

            const logReporter = new LogReporter(functionName);
            const statusReporter =
                !process.stdout.isTTY || "CI" in process.env
                    ? new NonInteractiveCliStatusReporter(logReporter)
                    : new InteractiveCliStatusReporter(logReporter);

            const runner = MigrationRunner.create({
                lambdaClient,
                functionName,
                statusReporter
            });

            const result = await runner.runMigration({
                version: process.env.WEBINY_VERSION || context.version
            });

            if (result) {
                const reporter = new CliMigrationRunReporter(logReporter, context);
                await reporter.report(result);
            }
        } catch (e) {
            context.error(`An error occurred while executing data migrations Lambda function!`);
            console.log(e);
            throw e;
        }
    }
};
