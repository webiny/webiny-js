import { DescribeEndpointCommand, IoTClient } from "@webiny/aws-sdk/client-iot/index.js";
import { type ICoreStackOutput } from "~/abstractions/features/GetAppStackOutput.js";

export const getIotEndpoint = (coreStackOutput: ICoreStackOutput): Promise<string> => {
    const iotClient = new IoTClient();

    return iotClient
        .send(
            new DescribeEndpointCommand({
                endpointType: "iot:Data-ATS"
            })
        )
        .then(({ endpointAddress }) => {
            const watchTopic = `webiny-watch-${coreStackOutput.deploymentId}`;
            const iotAuthorizerName = coreStackOutput.iotAuthorizerName;

            const queryParams = [
                `x-amz-customauthorizer-name=${iotAuthorizerName}`,
                `x-webiny-watch-command-topic=${watchTopic}`
            ].join("&");

            return `wss://${endpointAddress}/mqtt?${queryParams}`;
        });
};
