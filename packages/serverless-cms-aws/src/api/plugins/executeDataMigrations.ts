import LambdaClient from "aws-sdk/clients/lambda";
import { CliContext } from "@webiny/cli/types";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { printReport, runMigration } from "@webiny/data-migration/cli";

const clearLine = () => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
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

        context.info("Invoking data migrations Lambda function...");

        try {
            const lambdaClient = new LambdaClient({
                region: apiOutput.region
            });

            const response = await runMigration({
                lambdaClient,
                functionName: apiOutput["migrationLambdaArn"],
                statusCallback: ({ status, migrations }) => {
                    clearLine();
                    if (status === "running") {
                        const currentMigration = migrations.find(mig => mig.status === "running");
                        if (currentMigration) {
                            process.stdout.write(
                                `Running data migration ${currentMigration.id}...`
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
