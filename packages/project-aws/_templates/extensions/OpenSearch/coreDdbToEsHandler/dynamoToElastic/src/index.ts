import { createHandler } from "@webiny/handler-aws";
import { createOpenSearchClient, createOpenSearchContext } from "@webiny/api-opensearch";
import { createEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";

const osUsername = process.env.OPENSEARCH_USERNAME;
const osPassword = process.env.OPENSEARCH_PASSWORD;

const clientOptions: Parameters<typeof createOpenSearchClient>[0] = {
    endpoint: `https://${process.env.OPENSEARCH_ENDPOINT}`
};
if (osUsername && osPassword) {
    clientOptions.auth = { username: osUsername, password: osPassword };
}

const client = createOpenSearchClient(clientOptions);

export const handler = createHandler({
    plugins: [createOpenSearchContext(client), createEventHandler()],
    options: {
        bodyLimit: 536870912 // 512MB
    }
});
