import { createFeature } from "@webiny/feature/api";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { DynamoDBClient as DynamoDBClientAbstraction } from "./abstractions.js";
import { DynamoDBClient } from "./DynamoDBClient.js";

export { DynamoDBClient } from "./abstractions.js";

export const DynamoDBClientFeature = createFeature<DynamoDBDocument>({
    name: "Db/DynamoDB/DynamoDBClientFeature",
    register(container, documentClient) {
        const client = new DynamoDBClient({ client: documentClient });
        container.registerInstance(DynamoDBClientAbstraction, client);
    }
});
