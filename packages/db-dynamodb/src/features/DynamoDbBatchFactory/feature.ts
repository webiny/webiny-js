import { createFeature } from "@webiny/feature/api";
import { DynamoDbBatchFactory } from "./abstractions.js";
import { DynamoDbBatchFactoryImpl } from "./DynamoDbBatchFactory.js";

export const DynamoDbBatchFactoryFeature = createFeature({
    name: "Db/DynamoDB/DynamoDbBatchFactoryFeature",
    register(container) {
        container.registerInstance(DynamoDbBatchFactory, new DynamoDbBatchFactoryImpl());
    }
});
