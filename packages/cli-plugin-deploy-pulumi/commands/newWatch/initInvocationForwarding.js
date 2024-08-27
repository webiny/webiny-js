const path = require("path");
const { Worker } = require("worker_threads");
const { compress, decompress } = require("@webiny/utils/compression/gzip");

const WEBINY_WATCH_FN_INVOCATION_EVENT = "webiny.watch.functionInvocation";
const WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT = "webiny.watch.functionInvocationResult";

const WATCH_WORKER_PATH = path.join(__dirname, "localInvocationWorker.js");

const jsonStringifyAndCompress = input => {
    const jsonStringInput = JSON.stringify(input);
    return compress(jsonStringInput);
};

const decompressAndJsonParse = async input => {
    const inputBuffer = Buffer.from(input);
    const jsonStringResult = await decompress(inputBuffer);
    return JSON.parse(jsonStringResult);
};

const initInvocationForwarding = async ({
    iotEndpoint,
    iotEndpointTopic,
    sessionId,
    lambdaFunctions
}) => {
    // eslint-disable-next-line
    const { default: exitHook } = await import("exit-hook");

    const mqtt = require("mqtt");

    const client = await mqtt.connectAsync(iotEndpoint);

    await client.subscribeAsync(iotEndpointTopic);

    client.on("message", async (_, message) => {
        const payload = JSON.parse(message.toString());

        if (payload.eventType !== WEBINY_WATCH_FN_INVOCATION_EVENT) {
            return;
        }

        if (payload.data.sessionId !== sessionId) {
            return;
        }

        const invokedLambdaFunction = lambdaFunctions.find(
            lambdaFunction => lambdaFunction.name === payload.data.functionName
        );

        try {
            const result = await new Promise(async (resolve, reject) => {
                const worker = new Worker(WATCH_WORKER_PATH, {
                    env: { ...payload.data.env, WEBINY_WATCH_LOCAL_INVOCATION: "1" },
                    workerData: {
                        handler: {
                            path: invokedLambdaFunction.path,
                            args: await decompressAndJsonParse(payload.data.compressedArgs)
                        }
                    }
                });

                const unsubscribeExitHook = exitHook(async () => {
                    await worker.terminate();
                });

                worker.on("message", message => {
                    unsubscribeExitHook();

                    const { success, result, error } = JSON.parse(message);
                    if (success) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });
            });

            await client.publish(
                iotEndpointTopic,
                JSON.stringify({
                    eventType: WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT,
                    eventId: new Date().getTime(),
                    data: {
                        originalEventId: payload.eventId,
                        compressedResult: await jsonStringifyAndCompress(result),
                        compressedError: null
                    }
                })
            );
        } catch (error) {
            console.log(error);
            await client.publish(
                iotEndpointTopic,
                JSON.stringify({
                    eventType: WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT,
                    eventId: new Date().getTime(),
                    data: {
                        originalEventId: payload.eventId,
                        compressedResult: null,
                        compressedError: await jsonStringifyAndCompress({
                            message: error.message,
                            stack: error.stack
                        })
                    }
                })
            );
        }
    });

    return client;
};

module.exports = { initInvocationForwarding };
