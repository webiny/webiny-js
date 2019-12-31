import qs from "querystringify";
import createResponse from "./createResponse";
import LambdaClient from "aws-sdk/clients/lambda";
import createModels from "./models";

let models;

const ssr = async event => {
    const path = event.path + qs.stringify(event.multiValueQueryStringParameters, true);
    const httpMethod = event.httpMethod.toUpperCase();

    if (!models) {
        models = createModels();
    }

    let body = {};
    if (typeof event.body === "string") {
        try {
            body = JSON.parse(event.body);
        } catch {
            // Do nothing.
        }
    }

    const { tags } = body;
    if (httpMethod === "DELETE" && path === "/" && Array.isArray(tags)) {
        const { SsrCache } = models;
        for (let i = 0; i < tags.length; i++) {
            let tag = tags[i];
            let $elemMatch = {};
            if (tag.class) {
                $elemMatch.class = tag.class;
            }

            if (tag.id) {
                $elemMatch.id = tag.id;
            }

            const driver = SsrCache.getStorageDriver();
            await driver.getClient().runOperation({
                collection: driver.getCollectionName(SsrCache),
                operation: [
                    "update",
                    {
                        cacheTags: { $elemMatch }
                    },
                    { $set: { expiresOn: null } },
                    { multi: true }
                ]
            });
        }

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
