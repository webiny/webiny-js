import { createHandler } from "@webiny/handler-aws";
import { type OpenSearchClientOptions, registerOpenSearchCore } from "@webiny/api-opensearch";
import { createEventHandler } from "@webiny/api-dynamodb-to-elasticsearch";

const osUsername = process.env.OPENSEARCH_USERNAME;
const osPassword = process.env.OPENSEARCH_PASSWORD;

const clientOptions: OpenSearchClientOptions = {
    endpoint: `https://${process.env.OPENSEARCH_ENDPOINT}`
};
if (osUsername && osPassword) {
    clientOptions.auth = {
        username: osUsername,
        password: osPassword
    };
}

export const handler = createHandler({
    plugins: [registerOpenSearchCore(clientOptions), createEventHandler()],
    options: {
        bodyLimit: 536870912 // 512MB
    }
});
