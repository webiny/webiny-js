const readline = require("readline");
const LambdaClient = require("aws-sdk/clients/lambda");
const { getStackOutput } = require("../utils");
const { runMigration, printReport, getDuration } = require("@webiny/data-migration/cli");

const clearLine = () => {
    if (process.stdout.isTTY) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
    }
};

/**
 * On every deployment of the API project application, this plugin invokes the data migrations Lambda.
 */
module.exports = async (params, context) => {
    // No need to upload the app if we're doing a preview.
    if (params.inputs.preview) {
        return;
    }

    const apiOutput = getStackOutput({ folder: "apps/api", env: params.env });

    context.info("Executing data migration Lambda function...");

    try {
        const lambdaClient = new LambdaClient({
            region: apiOutput.region
        });

        const response = await runMigration({
            lambdaClient,
            functionName: apiOutput["migrationLambdaArn"],
            payload: {
                version: process.env.WEBINY_VERSION || context.version,
                pattern: params.pattern
            },
            statusCallback: ({ status, migrations }) => {
                clearLine();
                if (status === "running") {
                    const currentMigration = migrations.find(mig => mig.status === "running");
                    if (currentMigration) {
                        const duration = getDuration(currentMigration.startedOn);
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
        context.error(`An error occurred while trying to execute data migration Lambda function!`);
        console.log(e);
    }
};
