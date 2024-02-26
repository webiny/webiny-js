const { LambdaClient } = require("@webiny/aws-sdk/client-lambda");
const { getStackOutput } = require("../utils");
const {
    MigrationRunner,
    InteractiveCliStatusReporter,
    NonInteractiveCliStatusReporter,
    LogReporter,
    CliMigrationRunReporter
} = require("@webiny/data-migration/cli");

module.exports = async (params, context) => {
    const apiOutput = getStackOutput({ folder: "apps/api", env: params.env });

    context.info("Executing data migration Lambda function...");

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
            version: process.env.WEBINY_VERSION || context.version,
            pattern: params.pattern,
            force: params.force
        });

        if (result) {
            const reporter = new CliMigrationRunReporter(logReporter, context);
            await reporter.report(result);
        }
    } catch (e) {
        context.error(`An error occurred while trying to execute data migration Lambda function!`);
        console.log(e);
    }
};
