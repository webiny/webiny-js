const webinyWatchArgs = JSON.parse(process.env["WEBINY_WATCH"]);

exports.handler = async (...args) => {
    const { default: mqtt } = require("./mqtt");

    const client = await mqtt.connectAsync(webinyWatchArgs.iotEndpoint);

    await client.subscribeAsync(webinyWatchArgs.iotEndpointTopic);

    const eventId = new Date().getTime();

    const fnInvocationPayload = {
        eventType: "webiny.watch.functionInvocation",
        eventId,
        data: {
            sessionId: webinyWatchArgs.sessionId,
            functionName: webinyWatchArgs.functionName,
            args,
            env: process.env
        }
    };

    await client.publish(webinyWatchArgs.iotEndpointTopic, JSON.stringify(fnInvocationPayload));

    return new Promise((resolve, reject) => {
        client.on("message", async (_, message) => {
            const payload = JSON.parse(message.toString());

            if (payload.eventType !== "webiny.watch.functionInvocationResult") {
                return;
            }

            if (payload.data.originalEventId !== eventId) {
                return;
            }

            if (payload.data.error) {
                reject(payload.data.error);
                return;
            }

            resolve(payload.data.result);
        });
    });
};
