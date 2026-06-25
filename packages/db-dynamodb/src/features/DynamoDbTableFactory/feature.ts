import { createFeature } from "@webiny/feature/api";
import { DynamoDBClient } from "~/feature/DynamoDBClient/abstractions.js";
import { DynamoDbTableFactory } from "./abstractions.js";
import { DynamoDbTableFactoryImpl } from "./DynamoDbTableFactory.js";

export const DynamoDbTableFactoryFeature = createFeature({
    name: "Db/DynamoDB/DynamoDbTableFactoryFeature",
    register(container) {
        const dynamoDBClient = container.resolve(DynamoDBClient);
        container.registerInstance(DynamoDbTableFactory, new DynamoDbTableFactoryImpl(dynamoDBClient));
    }
});
