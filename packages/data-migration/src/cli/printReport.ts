import { CliContext } from "@webiny/cli/types";
import { MigrationEventHandlerResponse } from "~/types";

interface ReportParams {
    response: MigrationEventHandlerResponse;
    migrationLambdaArn: string;
    context: CliContext;
}

export const printReport = ({ response, migrationLambdaArn, context }: ReportParams) => {
    const { data, error } = response;

    if (error) {
        context.error(error.message);
        return;
    } else if (!data) {
        context.error(`Missing data response from the migrations Lambda function!`);
        return;
    }

    context.success(`Data migration Lambda %s executed successfully!`, migrationLambdaArn);

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
                context.error("Check AWS CloudWatch logs for more details.");
                continue;
            }
            // In case we have no error, but success is still false, let's output whole result object.
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
             * Everything is fine, output the migration ID, description, and duration.
             */
            context.info(
                ...[`- %s: ${executed.description} (%sms)`, executed.id, executed.result.duration]
            );
        }
    }

    if (skippedList.length === 0) {
        return;
    }
    context.info("Skipped:");
    for (const skipped of skippedList) {
        context.info(...[`- %s: ${skipped.description} (reason: %s)`, skipped.id, skipped.reason]);
    }
};
