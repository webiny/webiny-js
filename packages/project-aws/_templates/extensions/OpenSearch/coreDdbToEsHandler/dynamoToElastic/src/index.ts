import { createHandler } from "@webiny/handler-aws";
import { createOpenSearchClient, createOpenSearchContext } from "@webiny/api-opensearch";
import { createEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";

const client = createOpenSearchClient({
    endpoint: `https://${process.env.OPENSEARCH_ENDPOINT}`
});

export const handler = createHandler({
    plugins: [createOpenSearchContext(client), createEventHandler()],
    options: {
        bodyLimit: 536870912 // 512MB
    }
});
