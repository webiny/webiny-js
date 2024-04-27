const getIotEndpoint = () => {
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
            console.log('endpointAddress', endpointAddress)
            return `wss://${endpointAddress}/mqtt?x-amz-customauthorizer-name=Authorizer`;
        });
};

module.exports = { getIotEndpoint };
