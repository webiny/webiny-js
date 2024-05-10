const getDeploymentId = require("../../utils/getDeploymentId");
const getStackExport = require("../../utils/getStackExport");

const getIotEndpoint = (params = {}) => {
    const { IoTClient, DescribeEndpointCommand } = require("@webiny/aws-sdk/client-iot");
    const iotClient = new IoTClient();

    return iotClient
        .send(new DescribeEndpointCommand({}))
        .then(({ endpointAddress }) => {
            const [endpointId, ...remainingEndpointParts] = endpointAddress.split(".");

            // Why `-ats`? Could not find any info on the internet, but ChatGPT says the following.
            // It sounds like you're working with AWS IoT Core. The '-ats' suffix in the endpoint typically
            // indicates that it's for use with the MQTT over WebSocket protocol. This protocol is often used
            // for browser-based IoT applications because many browsers restrict direct access to MQTT ports.
            // So, AWS IoT Core provides an alternate endpoint with the '-ats' suffix that supports MQTT over
            // WebSocket, allowing browsers to securely connect to AWS IoT Core.
            return endpointId + "-ats." + remainingEndpointParts.join(".");
        })
        .then(endpointAddress => {
            const deploymentId = getDeploymentId(params);
            const stackExport = getStackExport(params)

            const iotEndpointAuthorizerName = 'Authorizer';

            const queryParams = [
                `x-amz-customauthorizer-name=${iotEndpointAuthorizerName}`,
                `x-webiny-watch-iot-endpoint-secret=${deploymentId}`
            ].join("&");

            return `wss://${endpointAddress}/mqtt?${queryParams}`;
        });
};

module.exports = { getIotEndpoint };
