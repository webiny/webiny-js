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
                return;
            } else if (!data) {
                context.error(`Missing data response from the migrations Lambda function!`);
                return;
            }

            context.success(
                `Data migration Lambda "${apiOutput["migrationLambdaArn"]}" executed successfully!`
            );

            const executedList = data.executed || [];
            const skippedList = data.skipped || [];
            if (executedList.length === 0 && skippedList.length === 0) {
                context.info("No applicable migrations were found.");
                return;
            }

            if (executedList.length > 0) {
                context.info("Executed:");
                for (const executed of executedList) {
                    /**
                     * When having an error in the result, let's output it to the console.
                     *
                     */
                    if (executed.result.error) {
                        context.error(
                            ...[
                                `- %s: ${executed.description} (%sms)`,
                                executed.id,
                                executed.result.duration
                            ]
                        );
                        context.error(
                            ...[
                                executed.result.error.name,
                                executed.result.error.message,
                                executed.result.error.code,
                                executed.result.error.data
                            ].filter(Boolean)
                        );
                        context.error("Check CloudWatch logs for more details.");
                        continue;
                    }
                    // In case we have no error but success is still false, let's output whole result object.
                    else if (!executed.result.success) {
                        context.error(
                            ` - %s: ${executed.description} - Missing error object on the result! (%sms)`,
                            executed.id,
                            executed.result.duration
                        );
                        context.error(JSON.stringify(executed.result, null, 2));
                        context.error("Check CloudWatch logs for more details.");
                        continue;
                    }
                    /**
                     * Everything is fine, output the migration ID, description and duration.
                     */
                    context.info(
                        ...[
                            `- %s: ${executed.description} (%sms)`,
                            executed.id,
                            executed.result.duration
                        ]
                    );
                }
            }

            if (skippedList.length === 0) {
                return;
            }
            context.info("Skipped:");
            for (const skipped of skippedList) {
                context.info(
                    ...[`- %s: ${skipped.description} (reason: %s)`, skipped.id, skipped.reason]
                );
            }
        } catch (e) {
            context.error(`An error occurred while executing data migrations Lambda function!`);
            console.log(e);
        }
    }
};
