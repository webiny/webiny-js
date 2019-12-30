import qs from "querystringify";
import createResponse from "./createResponse";
import LambdaClient from "aws-sdk/clients/lambda";
import createModels from "./models";

let models = null;

const serveSsrCache = async event => {
    const { path, multiValueQueryStringParameters, asyncSsrCacheRefresh } = event;
    const fullPath = path + qs.stringify(multiValueQueryStringParameters, true);
    if (!models) {
        models = createModels();
    }

    const { SsrCache } = models;
    let ssrCache = await SsrCache.findByPath(path);
    if (!ssrCache) {
        ssrCache = new SsrCache();
        ssrCache.path = fullPath;
        await ssrCache.save();
    }

    if (asyncSsrCacheRefresh) {
        await ssrCache.refresh();
        return createResponse(); // Response is irrelevant.
    }

    if (ssrCache.isEmpty) {
        await ssrCache.refresh();
        return createResponse({
            type: "text/html",
            body: ssrCache.content,
            headers: { "Cache-Control": "public, max-age=" + ssrCache.expiresIn / 1000 }
        });
    }

    if (ssrCache.hasExpired) {
        await ssrCache.incrementExpiresOn().save();
        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
        await Lambda.invoke({
            FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
            InvocationType: "Event",
            Payload: JSON.stringify({ ...event, asyncSsrCacheRefresh: true })
        }).promise();
    }

    return createResponse({
        type: "text/html",
        body: ssrCache.content,
        headers: { "Cache-Control": "public, max-age=" + ssrCache.expiresIn / 1000 }
    });
};

export default serveSsrCache;
