const path = require("path");
const { Worker } = require("worker_threads");

const WEBINY_WATCH_FN_INVOCATION_EVENT = "webiny.watch.functionInvocation";
const WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT = "webiny.watch.functionInvocationResult";

const WATCH_WORKER_PATH = path.join(__dirname, "localInvocationWorker.js");

const initEventsHandling = async ({
    iotEndpoint,
    iotEndpointTopic,
    sessionId,
    lambdaFunctions
}) => {
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
            // eslint-disable-next-line
            const { default: exitHook } = await import("exit-hook");

            const result = await new Promise(async (resolve, reject) => {
                const worker = new Worker(WATCH_WORKER_PATH, {
                    env: { ...payload.data.env, WEBINY_WATCH_LOCAL_INVOCATION: "1" },
                    workerData: {
                        handler: {
                            path: invokedLambdaFunction.path,
                            args: payload.data.args
                        }
                    }
                });

                worker.on("message", message => {
                    const { success, result, error } = JSON.parse(message);
                    if (success) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });

                worker.on("error", reject);

                worker.on("exit", code => {
                    if (code !== 0) {
                        reject(new Error(`Worker stopped with exit code ${code}`));
                    }
                });

                exitHook(() => {
                    worker.terminate();
                });
            });

            await client.publish(
                iotEndpointTopic,
                JSON.stringify({
                    eventType: WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT,
                    eventId: new Date().getTime(),
                    data: {
                        originalEventId: payload.eventId,
                        result,
                        error: null
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
                        data: null,
                        error: {
                            message: error.message,
                            stack: error.stack
                        }
                    }
                })
            );
        }
    });

    return client;
};

module.exports = { initEventsHandling };
