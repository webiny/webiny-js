import qs from "querystringify";
import LambdaClient from "aws-sdk/clients/lambda";
import { createResponse } from "@webiny/http-handler";
import mime from "mime-types";
import { getSsrHtml } from "./functions";
import { HttpHandlerPlugin } from "@webiny/http-handler/types";
import zlib from "zlib";

export default (options): HttpHandlerPlugin => {
    if (options.cache.enabled) {
        return {
            type: "handler",
            name: "handler-ssr-with-cache",
            canHandle({ args }) {
                const [event] = args;
                return event.httpMethod === "GET" && !mime.lookup(event.path);
            },
            async handle({ args, context }) {
                const [event] = args;
                const path = event.path + qs.stringify(event.multiValueQueryStringParameters, true);

                const { SsrCache } = context.models;
                let ssrCache = await SsrCache.findByPath(path);
                if (!ssrCache) {
                    ssrCache = new SsrCache();
                    ssrCache.path = path;
                    await ssrCache.save();
                }

                const version = event.headers["X-Cdn-Deployment-Id"];

                if (ssrCache.isEmpty) {
                    await ssrCache.refresh(version);
                } else {
                    if (ssrCache.isStale(version)) {
                        // On expiration, asynchronously trigger SSR cache refreshing.
                        // This will only increment expiresOn for the "options.cache.staleTtl" seconds, which
                        // is a short duration, enough for the actual refresh to complete, which will again update the
                        // expiration. Default value of "options.cache.staleTtl" is 20 seconds.
                        await ssrCache.incrementExpiresOn().save();
                        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
                        await Lambda.invoke({
                            FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                            InvocationType: "Event",
                            Payload: JSON.stringify({
                                ...event,
                                httpMethod: "POST",
                                body: {
                                    ssr: ["invalidateSsrCacheByPath", {
                                        path: ssrCache.path,
                                        refresh: true,
                                    }]
                                }
                            })
                        }).promise();
                    }
                }

                let buffer = Buffer.from(ssrCache.content);
                buffer = zlib.gzipSync(buffer);

                return createResponse({
                    type: "text/html",
                    body: buffer.toString("base64"),
                    isBase64Encoded: true,
                    headers: {
                        "Cache-Control": "public, max-age=" + ssrCache.expiresIn / 1000,
                        "Content-Encoding": "gzip"
                    }
                });
            }
        };
    }

    return {
        type: "handler",
        name: "handler-ssr-no-cache",
        canHandle({ args }) {
            const [event] = args;
            return event.httpMethod === "GET" && !mime.lookup(event.path);
        },
        async handle({ args }) {
            const [event] = args;
            const path = event.path + qs.stringify(event.multiValueQueryStringParameters, true);
            const body = await getSsrHtml(options.ssrFunction, { path });

            let buffer = Buffer.from(body);
            buffer = zlib.gzipSync(buffer);

            return createResponse({
                type: "text/html",
                body: buffer.toString("base64"),
                isBase64Encoded: true,
                headers: { "Cache-Control": "no-store", "Content-Encoding": "gzip" }
            });
        }
    };
};
