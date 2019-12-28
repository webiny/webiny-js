import createResponse from "./createResponse";
import { GraphQLClient } from "graphql-request";
import get from "lodash.get";
import qs from "querystringify";
import CloudFront from "aws-sdk/clients/cloudfront";

const API_URL = process.env.GRAPHQL_API_URL;
const GET_SRR_CACHE = /* GraphQL */ `
    query getSsrCache($path: String!) {
        ssrCache {
            getSsrCache(path: $path) {
                data {
                    hasExpired
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const invalidateSsrCache = async ({ path, multiValueQueryStringParameters }) => {
    const fullPath = path + qs.stringify(multiValueQueryStringParameters, true);
    const client = new GraphQLClient(API_URL);
    const response = await client.request(GET_SRR_CACHE, {
        path: fullPath
    });

    const { data, error } = get(response, "ssrCache.getSsrCache") || {};

    if (error) {
        throw new Error(error.message || error.code);
    }

    if (data.hasExpired) {
        const cloudfront = new CloudFront();
        await cloudfront
            .createInvalidation({
                DistributionId: "EOE5XRF198XSJ",
                InvalidationBatch: {
                    CallerReference: `${new Date().getTime()}-invalidate-ssr-cache`,
                    Paths: {
                        Quantity: "1",
                        Items: [fullPath]
                    }
                }
            })
            .promise();
    }

    return createResponse({
        type: "text/html",
        body: "",
        headers: { "Cache-Control": "no-store" }
    });
};

export default invalidateSsrCache;
