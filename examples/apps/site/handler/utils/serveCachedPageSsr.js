import createResponse from "./createResponse";
import { GraphQLClient } from "graphql-request";
import get from "lodash.get";
import qs from "querystringify";
import S
const API_URL = process.env.GRAPHQL_API_URL;
const GET_SRR_CACHE = /* GraphQL */ `
    query getSsrCache($path: String!) {
        ssrCache {
            getSsrCache(path: $path) {
                data {
                    content
                    expiresOn
                    hasExpired
                    expiresIn
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const serveCachedPageSsr = async ({ path, multiValueQueryStringParameters }) => {
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
    });
};

export default serveCachedPageSsr;
