import { createFeature } from "@webiny/feature/api";
import { DynamoDbBatchFactory } from "~/features/DynamoDbBatchFactory/abstractions.js";
import { DynamoDbEntityFactory } from "./abstractions.js";
import { DynamoDbEntityFactoryImpl } from "./DynamoDbEntityFactory.js";

export const DynamoDbEntityFactoryFeature = createFeature({
    name: "Db/DynamoDB/DynamoDbEntityFactoryFeature",
    register(container) {
        const batchFactory = container.resolve(DynamoDbBatchFactory);
        container.registerInstance(
            DynamoDbEntityFactory,
            new DynamoDbEntityFactoryImpl(batchFactory)
        );
    }
});
