import createResponse from "./createResponse";
import { GraphQLClient } from "graphql-request";
import get from "lodash.get";

const GET_PAGE_CACHE = /* GraphQL */ `
    query GetPageCache($path: String!) {
        pageBuilder {
            getPageCache(path: $path) {
                data {
                    content
                    hasExpired
                    expiresIn
                }
                error {
                    data
                    message
                }
            }
        }
    }
`;

const serveCachedPageSsr = async path => {
    const client = new GraphQLClient(process.env.API_URL);

    const response = await client.request(GET_PAGE_CACHE, {
        data: {
            path
        }
    });

    const content = get(response, "pageBuilder.getPageCache.data");
    await console.log(response);

    return createResponse({
        type: "text/html",
        body: html,
        isBase64Encoded: false,
        headers: { "Cache-Control": "no-store" }
    });
};

export default serveCachedPageSsr;
