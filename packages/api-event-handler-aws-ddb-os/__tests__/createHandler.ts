import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { getTestOpenSearchClient } from "@webiny/api-opensearch/testing/index.js";
import { createAwsDdbOsApiHandler } from "~/createWebinyApiHandler.js";
import type { CreateAwsDdbOsApiHandlerConfig } from "~/createWebinyApiHandler.js";

/**
 * Boots the full DDB+OS handler against the test DynamoDB (dynalite) and the test OpenSearch, and
 * returns a function that sends one GraphQL request through it.
 */
export const createHandler = (extensions: CreateAwsDdbOsApiHandlerConfig["extensions"]) => {
    const documentClient = getDocumentClient();
    const openSearchClient = getTestOpenSearchClient();
    const handler = createAwsDdbOsApiHandler({ extensions, documentClient, openSearchClient });

    let requestId = 0;

    return async (query: string, variables: Record<string, unknown> = {}) => {
        requestId++;
        const body = JSON.stringify({ query, variables });
        const result = await handler({
            httpMethod: "POST",
            path: "/graphql",
            headers: {
                "content-type": "application/json",
                "x-tenant": "root"
            },
            requestContext: { requestId: `test-req-${requestId}` },
            body,
            isBase64Encoded: false
        });

        const responseBody = String(result.body);

        return {
            statusCode: result.statusCode,
            raw: JSON.stringify(result),
            body: JSON.parse(responseBody)
        };
    };
};
