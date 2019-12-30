import qs from "querystringify";
import createResponse from "./createResponse";
import LambdaClient from "aws-sdk/clients/lambda";
import createModels from "./models";

let models;

const ssr = async event => {
    if (!models) {
        models = createModels();
    }

    const { multiValueQueryStringParameters, httpMethod } = event;
    const path = event.path + qs.stringify(multiValueQueryStringParameters, true);

    let body = {};
    if (typeof event.body === "string") {
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            // Do nothing.
        }
    }

    if (httpMethod === "DELETE" && path === "/" && Array.isArray(body.tags)) {
        const { SsrCache } = models;
        const deletePromises = [];
        for (let i = 0; i < tags.length; i++) {
            deletePromises.push(new Promise(async (resolve) => {
                let tag = tags[i];
                let $elemMatch = {};
                if (tag.class) {
                    $elemMatch.class = tag.class;
                }

                if (tag.id) {
                    $elemMatch.id = tag.id;
                }

                let ssrCaches = await SsrCache.find({
                    query: {
                        cacheTags: { $elemMatch }
                    }
                });

                for (let i = 0; i < ssrCaches.length; i++) {
                    let ssrCache = ssrCaches[i];
                    await ssrCache.invalidate();
                }

                resolve();
            }))
        }

        await Promise.all(deletePromises);

        return createResponse();
    }

    const { SsrCache } = models;
    let ssrCache = await SsrCache.findByPath(path);
    if (!ssrCache) {
        ssrCache = new SsrCache();
        ssrCache.path = path;
        await ssrCache.save();
    }

    if (httpMethod === "DELETE") {
        await ssrCache.invalidate();
        return createResponse();
    }

    if (httpMethod === "PATCH") {
        await ssrCache.refresh();
        return createResponse();
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
            Payload: JSON.stringify({ ...event, httpMethod: "PATCH" })
        }).promise();
    }

    return createResponse({
        type: "text/html",
        body: ssrCache.content,
        headers: { "Cache-Control": "public, max-age=" + ssrCache.expiresIn / 1000 }
    });
};

export default ssr;
