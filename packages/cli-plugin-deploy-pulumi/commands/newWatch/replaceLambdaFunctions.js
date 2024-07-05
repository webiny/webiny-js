const fs = require("fs");
const pRetry = require("p-retry");

const WATCH_MODE_NOTE_IN_DESCRIPTION = " (watch mode 💡)";

const replaceLambdaFunctions = async ({
    iotEndpoint,
    iotEndpointTopic,
    sessionId,
    lambdaFunctions
}) => {
    const {
        GetFunctionConfigurationCommand,
        LambdaClient,
        UpdateFunctionCodeCommand,
        UpdateFunctionConfigurationCommand
    } = require("@webiny/aws-sdk/client-lambda");

    const lambdaClient = new LambdaClient();

    return lambdaFunctions.map(async fn => {
        const getFnConfigCmd = new GetFunctionConfigurationCommand({ FunctionName: fn.name });
        const lambdaFnConfiguration = await lambdaClient.send(getFnConfigCmd);

        const updateFnCodeCmd = new UpdateFunctionCodeCommand({
            FunctionName: fn.name,
            ZipFile: fs.readFileSync(__dirname + "/handler/handler.zip")
        });

        await lambdaClient.send(updateFnCodeCmd);

        let Description = lambdaFnConfiguration.Description;
        if (!Description.endsWith(WATCH_MODE_NOTE_IN_DESCRIPTION)) {
            Description += WATCH_MODE_NOTE_IN_DESCRIPTION;
        }

        const updateFnConfigCmd = new UpdateFunctionConfigurationCommand({
            FunctionName: fn.name,
            Timeout: 120, // 2 minutes.
            Description,
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

        await pRetry(() => lambdaClient.send(updateFnConfigCmd));
    });
};

module.exports = { replaceLambdaFunctions };
