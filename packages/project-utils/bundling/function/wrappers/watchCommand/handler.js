const { handler } = require("./_handler");

const getWebinyWatchArgs = () => {
    const webinyWatchEnvVar = process.env["WEBINY_WATCH"];
    if (!webinyWatchEnvVar || typeof webinyWatchEnvVar !== "string") {
        return null;
    }

    try {
        return JSON.parse(webinyWatchEnvVar);
    } catch {
        return null;
    }
};

const IOT_ENDPOINT_TOPIC = "xyz";

exports.handler = async (...args) => {
    if (process.env['WEBINY_WATCH_LOCAL_INVOCATION'] === '1') {
        return handler(...args);
    }

    const webinyWatchArgs = getWebinyWatchArgs();
    if (!webinyWatchArgs) {
        return handler(...args);
    }

    const { default: mqtt } = require("./mqtt");

    const client = await mqtt.connectAsync(webinyWatchArgs.iotEndpoint);

    await client.subscribeAsync(IOT_ENDPOINT_TOPIC);

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

    await client.publish(IOT_ENDPOINT_TOPIC, JSON.stringify(fnInvocationPayload));

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
