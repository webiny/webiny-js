import path from "path";
import { Worker } from "worker_threads";
import { compress, decompress } from "@webiny/utils/compression/gzip";
import mqtt from "mqtt";
import type { listLambdaFunctions } from "~/commands/newWatch/listLambdaFunctions";

const WEBINY_WATCH_FN_INVOCATION_EVENT = "webiny.watch.functionInvocation";
const WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT = "webiny.watch.functionInvocationResult";
const WEBINY_WATCH_FN_INVOCATION_HANDSHAKE_EVENT = "webiny.watch.functionInvocationHandshake";

const WATCH_WORKER_PATH = path.join(__dirname, "localInvocationWorker.js");

const jsonStringifyAndCompress = (input: Record<string, any>): Promise<Buffer> => {
    const jsonStringInput = JSON.stringify(input);
    return compress(jsonStringInput);
};

const decompressAndJsonParse = async (input: string) => {
    const inputBuffer = Buffer.from(input);
    const jsonStringResult = await decompress(inputBuffer);

    const value = jsonStringResult?.toString
        ? jsonStringResult.toString("utf-8")
        : (jsonStringResult as unknown as string);

    return JSON.parse(value);
};

export interface IInitInvocationForwardingParamsLambdaFunction {
    name: string;
    path: string;
}

export interface IInitInvocationForwardingParams {
    iotEndpoint: string;
    iotEndpointTopic: string;
    sessionId: number;
    functionsList: ReturnType<typeof listLambdaFunctions>;
}

export const initInvocationForwarding = async ({
    iotEndpoint,
    iotEndpointTopic,
    sessionId,
    functionsList
}: IInitInvocationForwardingParams) => {
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

        await client.publish(
            iotEndpointTopic,
            JSON.stringify({
                eventType: WEBINY_WATCH_FN_INVOCATION_HANDSHAKE_EVENT,
                eventId: new Date().getTime(),
                data: {
                    originalEventId: payload.eventId,
                    compressedResult: null,
                    compressedError: null
                }
            })
        );

        const invokedLambdaFunction = functionsList.list.find(
            lambdaFunction => lambdaFunction.name === payload.data.functionName
        );
        if (!invokedLambdaFunction) {
            throw new Error(`Lambda function "${payload.data.functionName}" not found.`);
        }

        try {
            const result = await new Promise<Record<string, any>>(async (resolve, reject) => {
                const worker = new Worker(WATCH_WORKER_PATH, {
                    env: { ...payload.data.env, WEBINY_WATCH_LOCAL_INVOCATION: "1" },
                    workerData: {
                        handler: {
                            path: invokedLambdaFunction.path,
                            args: await decompressAndJsonParse(payload.data.compressedArgs)
                        }
                    }
                });

                const { default: exitHook } = await import(
                    /* webpackChunkName: "exit-hook" */ "exit-hook"
                );

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
