import { createHandler } from "@webiny/handler-aws";
import { createOpenSearchContext } from "@webiny/api-opensearch";
import { createEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";

export const handler = createHandler({
    plugins: [
        createOpenSearchContext({
            endpoint: `https://${process.env.OPENSEARCH_ENDPOINT}`
        }),
        createEventHandler()
    ],
    options: {
        bodyLimit: 536870912 // 512MB
    }
});
