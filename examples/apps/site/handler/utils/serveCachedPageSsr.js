import qs from "querystringify";
import createResponse from "./createResponse";
import LambdaClient from "aws-sdk/clients/lambda";
import createModels from "./models";

let models = null;

const serveCachedPageSsr = async ({ path, multiValueQueryStringParameters }) => {
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

    if (ssrCache.isEmpty) {
        await ssrCache.refresh();
        return createResponse({
            type: "text/html",
            body: ssrCache.content,
            headers: { "Cache-Control": "public, max-age=" + ssrCache.expiresIn / 1000 }
        });
    }

    return createResponse({
        type: "text/html",
        body: `ne mere bajo moj`,
        headers: {}
    });

    if (ssrCache.hasExpired) {
        await ssrCache.incrementExpiresOn().save();

        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
        const body = JSON.stringify({
            operationName: "generateSsrCache",
            variables: { path },
            query: GENERATE_SSR_CACHE_GQL
        });

        await Lambda.invoke({
            FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
            InvocationType: "Event",
            Payload: JSON.stringify({
                httpMethod: "POST",
                body
            })
        }).promise();
    }

    return new Response(ssrCache);
    /*
    const fullPath = path + qs.stringify(multiValueQueryStringParameters, true);

    const client = new GraphQLClient(API_URL);
    const response = await client.request(GET_SRR_CACHE, {
        path: path + qs.stringify(multiValueQueryStringParameters, true)
    });

    const { data, error } = get(response, "ssrCache.getSsrCache") || {};

    if (error) {
        throw new Error(error.message || error.code);
    }

    const maxAge = (data.expiresIn / 1000); // Seconds.

    return createResponse({
        type: "text/html",
        body: data.content,
        headers: { "Cache-Control": "public, max-age=" + maxAge }
    });*/
};

export default serveCachedPageSsr;
