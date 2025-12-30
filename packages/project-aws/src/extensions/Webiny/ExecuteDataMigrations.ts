import { LambdaClient } from "@webiny/aws-sdk/client-lambda/index.js";
import type { MigrationStatusReporter } from "@webiny/data-migration/cli/index.js";
import {
    CliMigrationRunReporter,
    InteractiveCliStatusReporter,
    LogReporter,
    MigrationRunner,
    NonInteractiveCliStatusReporter,
    VoidStatusReporter
} from "@webiny/data-migration/cli/index.js";
import { ApiAfterDeploy, GetProject, UiService } from "@webiny/project/abstractions/index.js";
import { IDefaultStackOutput } from "~/pulumi/types.js";
import { ApiStackOutputService } from "~/abstractions/index.js";

/**
 * On every deployment of the API project application, this plugin invokes the data migrations Lambda.
 */
class ExecuteDataMigrationsImpl implements ApiAfterDeploy.Interface {
    constructor(
        private ui: UiService.Interface,
        private apiStackOutputService: ApiStackOutputService.Interface,
        private getProject: GetProject.Interface
    ) {}

    async execute(params: ApiAfterDeploy.Params) {
        // No need to run migrations if we're doing a preview.
        if (params.preview) {
            return;
        }

        const apiOutput = await this.apiStackOutputService.execute<IDefaultStackOutput>();
        if (!apiOutput) {
            // This should never happen, but just in case...
            throw new Error(
                "Could not retrieve the API stack output while trying to run data migrations."
            );
        }

        const ui = this.ui;
        ui.info("Executing data migrations AWS Lambda function...");

        const logStreamingEnabled = process.env.WBY_MIGRATION_LOG_STREAMING !== "false";
        if (!logStreamingEnabled) {
            ui.warning(
                [
                    "Data migration log streaming is disabled.",
                    "Note that the logs will still be accessible in Amazon CloudWatch.",
                    "Learn more: https://webiny.link/cloudwatch"
                ].join(" ")
            );
        }

        try {
            const lambdaClient = new LambdaClient({
                region: apiOutput.region
            });

            const functionName = apiOutput["migrationLambdaArn"];

            const logReporter = new LogReporter(functionName);

            let statusReporter: MigrationStatusReporter = new VoidStatusReporter();
            if (params.dataMigrationLogStreaming) {
                const useNonInteractiveReporter = !process.stdout.isTTY || "CI" in process.env;
                statusReporter = useNonInteractiveReporter
                    ? new NonInteractiveCliStatusReporter(logReporter)
                    : new InteractiveCliStatusReporter(logReporter);
            }

            const runner = MigrationRunner.create({
                lambdaClient,
                functionName,
                statusReporter
            });

            const project = this.getProject.execute();

            const result = await runner.runMigration({
                version: process.env.WBY_VERSION || project.version
            });

            if (result) {
                const reporter = new CliMigrationRunReporter(logReporter, {
                    uiService: this.ui
                });
                await reporter.report(result);
            }
        } catch (e) {
            ui.error(`An error occurred while executing data migrations Lambda function!`);
            ui.text(e);
            throw e;
        }
    }
}

export const ExecuteDataMigrations = ApiAfterDeploy.createImplementation({
    implementation: ExecuteDataMigrationsImpl,
    dependencies: [UiService, ApiStackOutputService, GetProject]
});
