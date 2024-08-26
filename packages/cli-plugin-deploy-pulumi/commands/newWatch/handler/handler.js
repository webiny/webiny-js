const zlib = require("zlib");

const webinyWatchArgs = JSON.parse(process.env["WEBINY_WATCH"]);

const jsonStringifyAndCompress = input => {
    const jsonStringInput = JSON.stringify(input);
    return new Promise(function (resolve, reject) {
        zlib.gzip(jsonStringInput, {}, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
};

const decompressAndJsonParse = async input => {
    const inputBuffer = Buffer.from(input);
    const jsonStringResult = await new Promise(function (resolve, reject) {
        zlib.gunzip(inputBuffer, {}, function (error, result) {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });

    return JSON.parse(jsonStringResult);
};

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
            compressedArgs: await jsonStringifyAndCompress(args),
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

            if (payload.data.compressedError) {
                const decompressedError = await decompressAndJsonParse(
                    payload.data.compressedError
                );
                reject(decompressedError);
                return;
            }

            const decompressedResult = await decompressAndJsonParse(payload.data.compressedResult);
            resolve(decompressedResult);
        });
    });
};
