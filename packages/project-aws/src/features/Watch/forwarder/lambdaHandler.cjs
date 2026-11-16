const zlib = require("zlib");

const WEBINY_WATCH_FN_INVOCATION_EVENT = "webiny.watch.functionInvocation";
const WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT = "webiny.watch.functionInvocationResult";
const WEBINY_WATCH_FN_INVOCATION_HANDSHAKE_EVENT = "webiny.watch.functionInvocationHandshake";
const DEFAULT_LOCAL_EXECUTION_HANDSHAKE_TIMEOUT = 5_000; // 5 seconds

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
    eventType: WEBINY_WATCH_FN_INVOCATION_EVENT,
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
    const handshakeTimeoutDuration = webinyWatchArgs.localExecutionHandshakeTimeout
      ? webinyWatchArgs.localExecutionHandshakeTimeout * 1000
      : DEFAULT_LOCAL_EXECUTION_HANDSHAKE_TIMEOUT;

    const timeoutId = setTimeout(() => {
      const [event] = args;
      let origin = "*";
      if (event.headers) {
        origin = event.headers.origin;
      }

      resolve({
        statusCode: 500,
        body: JSON.stringify({
          code: "LOCAL_AWS_LAMBDA_TIMEOUT",
          data: null,
          message: [
            "Local AWS Lambda function execution timed out. Did you maybe stop the `webiny watch`",
            "command? If so, please restart the command or deploy your changes via the",
            "`webiny deploy` command, for example: `yarn webiny deploy api --env dev`.",
            "Learn more: https://webiny.link/local-aws-lambda-development."
          ].join(" ")
        }),
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }, handshakeTimeoutDuration);

    client.on("message", async (_, message) => {
      const payload = JSON.parse(message.toString());
      if (payload.eventType === WEBINY_WATCH_FN_INVOCATION_HANDSHAKE_EVENT) {
        if (payload.data.originalEventId !== eventId) {
          return;
        }

        clearTimeout(timeoutId);
        return;
      }

      if (payload.eventType === WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT) {
        if (payload.data.originalEventId !== eventId) {
          return;
        }

        // Just in case the timeout was not cleared, we clear it here too.
        clearTimeout(timeoutId);

        if (payload.data.compressedError) {
          const decompressedError = await decompressAndJsonParse(payload.data.compressedError);
          reject(decompressedError);
        } else {
          const decompressedResult = await decompressAndJsonParse(payload.data.compressedResult);
          resolve(decompressedResult);
        }
      }
    });
  });
};
