/**
 * `webiny watch` forwarder for the API's Lambda web function.
 *
 * While a watch session runs, the web function runs this instead of the API. It is an HTTP server that
 * turns each request into an API Gateway (payload format 2.0) event and forwards it over IoT with the
 * same protocol as the regular Lambda forwarder (`../handler/handler.zip`), under the regular `graphql`
 * Lambda's name. The watch session on the developer's machine runs that event through the local
 * `graphql` handler, which handles API Gateway events, and the result comes back as the HTTP response.
 * So the local side of `webiny watch` needs no changes.
 *
 * Runs in the web function on its own, so it uses only Node built-ins and `mqtt.js`, which is zipped
 * next to it from `handler.zip`. The protocol constants match those in `handler.zip` and in
 * `@webiny/project`'s `initInvocationForwarding.ts`.
 */
import http from "node:http";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const WEBINY_WATCH_FN_INVOCATION_EVENT = "webiny.watch.functionInvocation";
const WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT = "webiny.watch.functionInvocationResult";
const WEBINY_WATCH_FN_INVOCATION_HANDSHAKE_EVENT = "webiny.watch.functionInvocationHandshake";
const DEFAULT_LOCAL_EXECUTION_HANDSHAKE_TIMEOUT = 5_000;

// `mqtt.js` is the CommonJS bundle the regular Lambda forwarder uses.
const require = createRequire(import.meta.url);
const { default: mqtt } = require("./mqtt.js");

const webinyWatchArgs = JSON.parse(process.env["WEBINY_WATCH"]);

let handshakeTimeout = DEFAULT_LOCAL_EXECUTION_HANDSHAKE_TIMEOUT;
if (webinyWatchArgs.localExecutionHandshakeTimeout) {
  handshakeTimeout = webinyWatchArgs.localExecutionHandshakeTimeout * 1000;
}

// Event IDs only need to be unique within a session. Up to 16 requests run at once in one
// environment, so a timestamp alone could repeat.
let eventCounter = 0;
const nextEventId = () => {
  eventCounter = (eventCounter + 1) % 1000;
  return Date.now() * 1000 + eventCounter;
};

const gzip = input => {
  const json = JSON.stringify(input);
  return new Promise((resolve, reject) => {
    zlib.gzip(json, {}, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

const gunzip = input => {
  const buffer = Buffer.from(input);
  return new Promise((resolve, reject) => {
    zlib.gunzip(buffer, {}, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      const json = result.toString("utf-8");
      resolve(JSON.parse(json));
    });
  });
};

const readBody = req => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      resolve(body);
    });
    req.on("error", reject);
  });
};

const toApiGatewayEvent = (req, body) => {
  const url = new URL(req.url, "http://localhost");

  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      headers[name] = value.join(",");
    } else {
      headers[name] = value;
    }
  }

  let queryStringParameters;
  if (url.searchParams.size > 0) {
    queryStringParameters = Object.fromEntries(url.searchParams);
  }

  let cookies;
  if (headers.cookie) {
    cookies = headers.cookie.split(";").map(cookie => cookie.trim());
  }

  let eventBody;
  if (body.length > 0) {
    eventBody = body.toString("utf-8");
  }

  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: url.pathname,
    rawQueryString: url.search.slice(1),
    cookies,
    headers,
    queryStringParameters,
    requestContext: {
      domainName: headers.host,
      http: {
        method: req.method,
        path: url.pathname,
        protocol: "HTTP/1.1",
        sourceIp: req.socket.remoteAddress,
        userAgent: headers["user-agent"]
      },
      requestId: crypto.randomUUID(),
      routeKey: "$default",
      stage: "$default",
      timeEpoch: Date.now()
    },
    body: eventBody,
    isBase64Encoded: false
  };
};

const timeoutResult = origin => {
  const body = JSON.stringify({
    code: "LOCAL_AWS_LAMBDA_TIMEOUT",
    data: null,
    message: [
      "Local execution timed out. Did you maybe stop the `webiny watch` command? If so,",
      "restart it or deploy your changes via `webiny deploy`, for example:",
      "`yarn webiny deploy api --env dev`."
    ].join(" ")
  });

  return {
    statusCode: 500,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Credentials": "true"
    },
    body
  };
};

const forward = async event => {
  const client = await mqtt.connectAsync(webinyWatchArgs.iotEndpoint);

  try {
    await client.subscribeAsync(webinyWatchArgs.iotEndpointTopic);

    const eventId = nextEventId();
    const context = { functionName: webinyWatchArgs.functionName, awsRequestId: eventId };

    const result = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const fallback = timeoutResult(event.headers.origin);
        resolve(fallback);
      }, handshakeTimeout);

      client.on("message", async (_, message) => {
        const text = message.toString();
        const payload = JSON.parse(text);
        if (payload.data?.originalEventId !== eventId) {
          return;
        }

        if (payload.eventType === WEBINY_WATCH_FN_INVOCATION_HANDSHAKE_EVENT) {
          clearTimeout(timeoutId);
          return;
        }

        if (payload.eventType !== WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT) {
          return;
        }

        clearTimeout(timeoutId);
        if (payload.data.compressedError) {
          const error = await gunzip(payload.data.compressedError);
          reject(error);
        } else {
          const value = await gunzip(payload.data.compressedResult);
          resolve(value);
        }
      });
    });

    const compressedArgs = await gzip([event, context]);
    const invocation = JSON.stringify({
      eventType: WEBINY_WATCH_FN_INVOCATION_EVENT,
      eventId,
      data: {
        sessionId: webinyWatchArgs.sessionId,
        functionName: webinyWatchArgs.functionName,
        compressedArgs,
        env: process.env
      }
    });
    await client.publish(webinyWatchArgs.iotEndpointTopic, invocation);

    return await result;
  } finally {
    await client.endAsync();
  }
};

const writeResult = (res, result) => {
  const headers = { ...result.headers };
  if (result.cookies && result.cookies.length > 0) {
    headers["set-cookie"] = result.cookies;
  }

  let body = result.body ?? "";
  if (result.isBase64Encoded) {
    body = Buffer.from(body, "base64");
  }

  res.writeHead(result.statusCode ?? 200, headers);
  res.end(body);
};

const writeError = (res, error) => {
  const body = JSON.stringify({ message: error?.message ?? String(error) });
  res.writeHead(500, { "content-type": "application/json" });
  res.end(body);
};

const server = http.createServer(async (req, res) => {
  try {
    const body = await readBody(req);
    const event = toApiGatewayEvent(req, body);
    const result = await forward(event);
    writeResult(res, result);
  } catch (error) {
    writeError(res, error);
  }
});

const endpoint = process.env.AWS_LAMBDA_HTTP_ENDPOINT || "127.0.0.1:3000";
const separator = endpoint.lastIndexOf(":");
const hostname = endpoint.slice(0, separator);
const portText = endpoint.slice(separator + 1);
const port = Number(portText);
server.listen(port, hostname);

process.once("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
  server.closeIdleConnections();
  const forceExit = setTimeout(() => {
    process.exit(0);
  }, 5_000);
  forceExit.unref();
});
