import createResponse from "./createResponse";
import { GraphQLClient } from "graphql-request";
import get from "lodash.get";

const GET_SRR_CACHE = /* GraphQL */ `
    query getSsrCache($key: String!) {
        ssrCache {
            getSsrCache(key: $key) {
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

const serveCachedPageSsr = async key => {
    const client = new GraphQLClient(process.env.API_URL);
    const response = await client.request(GET_SRR_CACHE, {
        key
    });

    const { data, error } = get(response, "ssrCache.getSsrCache") || {};

    if (error) {
        throw new Error(error.message || error.code);
    }

    return createResponse({
        type: "text/html",
        body: data.content,
        headers: { "Cache-Control": "public, max-age=10" }
    });
};

export default serveCachedPageSsr;
