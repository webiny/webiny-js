const getStackOutput = require("../../utils/getStackOutput");

const getIotEndpoint = (params = {}) => {
    const { IoTClient, DescribeEndpointCommand } = require("@webiny/aws-sdk/client-iot");
    const iotClient = new IoTClient();

    return iotClient
        .send(
            new DescribeEndpointCommand({
                endpointType: "iot:Data-ATS"
            })
        )
        .then(({ endpointAddress }) => {
            const coreStackOutput = getStackOutput({
                folder: "core",
                env: params.env
            });

            const watchCommandTopic = `webiny-watch-${coreStackOutput.deploymentId}`;
            const iotAuthorizerName = coreStackOutput.iotAuthorizerName;

            const queryParams = [
                `x-amz-customauthorizer-name=${iotAuthorizerName}`,
                `x-webiny-watch-command-topic=${watchCommandTopic}`
            ].join("&");

            return `wss://${endpointAddress}/mqtt?${queryParams}`;
        });
};

module.exports = { getIotEndpoint };
