import LambdaClient from "aws-sdk/clients/lambda";
import { CliContext } from "@webiny/cli/types";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { MigrationEventHandlerResponse } from "@webiny/data-migration";

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

            const response = await lambdaClient
                .invoke({
                    FunctionName: apiOutput["migrationLambdaArn"],
                    InvocationType: "RequestResponse"
                })
                .promise();

            const { data, error } = JSON.parse(
                response.Payload as string
            ) as MigrationEventHandlerResponse;

            if (error) {
                context.error(error.message);
            } else {
                const logItems = [
                    data.executed.length ? ["Executed:"] : undefined,
                    ...data.executed.map(mig => {
                        return [`- %s: ${mig.description} (%sms)`, mig.id, mig.result.duration];
                    }),
                    data.skipped.length ? ["Skipped:"] : undefined,
                    ...data.skipped.map(mig => {
                        return [`- %s: ${mig.description} (reason: %s)`, mig.id, mig.reason];
                    })
                ].filter(Boolean);
                context.success("Data migrations Lambda executed successfully!");
                if (logItems.length) {
                    logItems.forEach(line => context.info(...(line as string[])));
                } else {
                    context.info("No applicable migrations were found.");
                }
            }
        } catch (e) {
            context.error(`An error occurred while executing data migrations Lambda function!`);
            console.log(e);
        }
    }
};
