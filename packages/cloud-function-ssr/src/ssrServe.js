import qs from "querystringify";
import LambdaClient from "aws-sdk/clients/lambda";
import { createResponse } from "@webiny/cloud-function";
import mime from "mime-types";

export default () => ({
    type: "handler",
    name: "handler-ssr",
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

        if (ssrCache.isEmpty) {
            await ssrCache.refresh();
        } else if (ssrCache.hasExpired) {
            // On expiration, asynchronously trigger SSR cache refreshing.
            await ssrCache.incrementExpiresOn().save();
            const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
            await Lambda.invoke({
                FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
                InvocationType: "Event",
                Payload: JSON.stringify({
                    ...event,
                    httpMethod: "POST",
                    body: ["refreshSsrCache", { path: ssrCache.path }]
                })
            }).promise();
        }

        return createResponse({
            type: "text/html",
            body: ssrCache.content,
            headers: { "Cache-Control": "public, max-age=" + ssrCache.expiresIn / 1000 }
        });
    }
});
