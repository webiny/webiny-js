const updateLambdaFunctionsEnvVars = async ({
    iotEndpoint,
    iotEndpointTopic,
    sessionId,
    lambdaFunctions
}) => {
    const {
        LambdaClient,
        GetFunctionConfigurationCommand,
        UpdateFunctionConfigurationCommand
    } = require("@aws-sdk/client-lambda");

    const lambdaClient = new LambdaClient();

    return lambdaFunctions.map(async fn => {
        const getFnConfigCmd = new GetFunctionConfigurationCommand({ FunctionName: fn.name });
        const lambdaFnConfiguration = await lambdaClient.send(getFnConfigCmd);

        const updateFnConfigCmd = new UpdateFunctionConfigurationCommand({
            FunctionName: fn.name,
            Timeout: 120, // 2 minutes
            Environment: {
                Variables: {
                    ...lambdaFnConfiguration.Environment.Variables,
                    WEBINY_WATCH: JSON.stringify({
                        enabled: true,
                        sessionId,
                        iotEndpoint,
                        iotEndpointTopic,
                        functionName: fn.name
                    })
                }
            }
        });

        await lambdaClient.send(updateFnConfigCmd);
    });
};

module.exports = { updateLambdaFunctionsEnvVars };
