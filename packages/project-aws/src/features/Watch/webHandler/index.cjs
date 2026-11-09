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
 * Zipped at watch time next to `mqtt.js` from `handler.zip`, as `index.js`.
 */
const http = require("node:http");
const zlib = require("node:zlib");
const crypto = require("node:crypto");

const WEBINY_WATCH_FN_INVOCATION_EVENT = "webiny.watch.functionInvocation";
const WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT = "webiny.watch.functionInvocationResult";
const WEBINY_WATCH_FN_INVOCATION_HANDSHAKE_EVENT = "webiny.watch.functionInvocationHandshake";
const DEFAULT_LOCAL_EXECUTION_HANDSHAKE_TIMEOUT = 5_000;

const webinyWatchArgs = JSON.parse(process.env["WEBINY_WATCH"]);

// Event IDs only need to be unique within a session. Up to 16 requests run at once in one
// environment, so a timestamp alone could repeat.
let eventCounter = 0;
const nextEventId = () => {
  eventCounter = (eventCounter + 1) % 1000;
  return Date.now() * 1000 + eventCounter;
};

const gzip = input => {
  return new Promise((resolve, reject) => {
    zlib.gzip(JSON.stringify(input), {}, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

const gunzip = input => {
  return new Promise((resolve, reject) => {
    zlib.gunzip(Buffer.from(input), {}, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.parse(result.toString("utf-8")));
      }
    });
  });
};

const readBody = req => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
};

const toApiGatewayEvent = (req, body) => {
  const url = new URL(req.url, "http://localhost");

  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    headers[name] = Array.isArray(value) ? value.join(",") : value;
  }

  let queryStringParameters;
  if (url.searchParams.size > 0) {
    queryStringParameters = Object.fromEntries(url.searchParams);
  }

  let cookies;
  if (headers.cookie) {
    cookies = headers.cookie.split(";").map(cookie => cookie.trim());
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
    body: body.length > 0 ? body.toString("utf-8") : undefined,
    isBase64Encoded: false
  };
};

const timeoutResult = origin => {
  return {
    statusCode: 500,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Credentials": "true"
    },
    body: JSON.stringify({
      code: "LOCAL_AWS_LAMBDA_TIMEOUT",
      data: null,
      message: [
        "Local execution timed out. Did you maybe stop the `webiny watch` command? If so,",
        "restart it or deploy your changes via `webiny deploy`, for example:",
        "`yarn webiny deploy api --env dev`."
      ].join(" ")
    })
  };
};

const forward = async event => {
  const { default: mqtt } = require("./mqtt");
  const client = await mqtt.connectAsync(webinyWatchArgs.iotEndpoint);

  try {
    await client.subscribeAsync(webinyWatchArgs.iotEndpointTopic);

    const eventId = nextEventId();
    const context = { functionName: webinyWatchArgs.functionName, awsRequestId: eventId };

    const result = new Promise((resolve, reject) => {
      const handshakeTimeout = webinyWatchArgs.localExecutionHandshakeTimeout
        ? webinyWatchArgs.localExecutionHandshakeTimeout * 1000
        : DEFAULT_LOCAL_EXECUTION_HANDSHAKE_TIMEOUT;

      const timeoutId = setTimeout(() => {
        resolve(timeoutResult(event.headers.origin));
      }, handshakeTimeout);

      client.on("message", async (_, message) => {
        const payload = JSON.parse(message.toString());
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
          reject(await gunzip(payload.data.compressedError));
        } else {
          resolve(await gunzip(payload.data.compressedResult));
        }
      });
    });

    const invocation = {
      eventType: WEBINY_WATCH_FN_INVOCATION_EVENT,
      eventId,
      data: {
        sessionId: webinyWatchArgs.sessionId,
        functionName: webinyWatchArgs.functionName,
        compressedArgs: await gzip([event, context]),
        env: process.env
      }
    };
    await client.publish(webinyWatchArgs.iotEndpointTopic, JSON.stringify(invocation));

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

const server = http.createServer(async (req, res) => {
  try {
    const body = await readBody(req);
    const event = toApiGatewayEvent(req, body);
    const result = await forward(event);
    writeResult(res, result);
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ message: error?.message ?? String(error) }));
  }
});

const endpoint = process.env.AWS_LAMBDA_HTTP_ENDPOINT || "127.0.0.1:3000";
const separator = endpoint.lastIndexOf(":");
server.listen(Number(endpoint.slice(separator + 1)), endpoint.slice(0, separator));

process.once("SIGTERM", () => {
  server.close(() => process.exit(0));
  server.closeIdleConnections();
  setTimeout(() => process.exit(0), 5_000).unref();
});
