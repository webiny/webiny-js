const LambdaClient = require("aws-sdk/clients/lambda");
const { getStackOutput } = require("../utils");
const { runMigration, printReport } = require("@webiny/data-migration/cli");

const clearLine = () => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
};

/**
 * On every deployment of the API project application, this plugin invokes the data migrations Lambda.
 */
module.exports = async (params, context) => {
    const apiOutput = getStackOutput({ folder: "apps/api", env: params.env });

    context.info("Invoking data migration Lambda function...");

    try {
        const lambdaClient = new LambdaClient({
            region: apiOutput.region
        });

        const response = await runMigration({
            lambdaClient,
            functionName: apiOutput["migrationLambdaArn"],
            payload: {
                pattern: params.pattern
            },
            statusCallback: ({ status, migrations }) => {
                clearLine();
                if (status === "running") {
                    const currentMigration = migrations.find(mig => mig.status === "running");
                    if (currentMigration) {
                        process.stdout.write(`Running data migration ${currentMigration.id}...`);
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
