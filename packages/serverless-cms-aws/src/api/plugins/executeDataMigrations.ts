import readline from "readline";
import LambdaClient from "aws-sdk/clients/lambda";
import { CliContext } from "@webiny/cli/types";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { printReport, runMigration, getDuration } from "@webiny/data-migration/cli";

const clearLine = () => {
    if (process.stdout.isTTY) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
    }
};

/**
 * On every deployment of the API project application, this plugin invokes the data migrations Lambda.
 */
export const executeDataMigrations = {
    type: "hook-after-deploy",
    name: "hook-after-deploy-api-execute-data-migrations",
    async hook(params: Record<string, any>, context: CliContext) {
        if (params.inputs.build === false) {
            context.info(`"--no-build" argument detected - skipping data migrations.`);
            return;
        }

        const apiOutput = getStackOutput({ folder: "apps/api", env: params.env });

        context.info("Executing data migrations Lambda function...");

        try {
            const lambdaClient = new LambdaClient({
                region: apiOutput.region
            });

            const response = await runMigration({
                lambdaClient,
                functionName: apiOutput["migrationLambdaArn"],
                payload: {
                    version: process.env.WEBINY_VERSION || context.version
                },
                statusCallback: ({ status, migrations }) => {
                    clearLine();
                    if (status === "running") {
                        const currentMigration = migrations.find(mig => mig.status === "running");
                        if (currentMigration) {
                            const duration = getDuration(currentMigration.startedOn as string);
                            process.stdout.write(
                                `Running data migration ${currentMigration.id} (${duration})...`
                            );
                        }
                        return;
                    }

                    if (status === "init") {
                        process.stdout.write(`Checking data migrations...`);
                    }
                }
            });

            clearLine();

            printReport({ response, context, migrationLambdaArn: apiOutput["migrationLambdaArn"] });
        } catch (e) {
            context.error(`An error occurred while executing data migrations Lambda function!`);
            console.log(e);
        }
    }
};
