const LambdaClient = require("aws-sdk/clients/lambda");
const { getStackOutput } = require("../utils");

/**
 * On every deployment of the API project application, this plugin invokes the data migrations Lambda.
 */
module.exports = async (params, context) => {
    const apiOutput = getStackOutput({ folder: "apps/api", env: params.env });

    context.info("Invoking data migrations Lambda function...");

    try {
        const lambdaClient = new LambdaClient({
            region: apiOutput.region
        });

        const response = await lambdaClient
            .invoke({
                FunctionName: apiOutput["migrationLambdaArn"],
                InvocationType: "RequestResponse",
                Payload: JSON.stringify({
                    pattern: params.pattern
                })
            })
            .promise();

        const { data, error } = JSON.parse(response.Payload);

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
                }),
                data.notApplicable.length ? ["Not applicable:"] : undefined,
                ...data.notApplicable.map(mig => {
                    return [`- %s: ${mig.description}`, mig.id];
                })
            ].filter(Boolean);
            context.success("Data migrations Lambda executed successfully!");
            logItems.forEach(line => context.info(...line));
        }
    } catch (e) {
        context.error(`An error occurred while executing data migrations Lambda function!`);
        console.log(e);
    }
};
