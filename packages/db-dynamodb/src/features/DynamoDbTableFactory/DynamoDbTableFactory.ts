import { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/DynamoDbDocumentClient.js";
import type { DynamoDbDocumentClient as IDynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";
import type { IDynamoDbTableFactory } from "./abstractions.js";
import type { IDynamoDbTableFactoryCreateParams } from "./abstractions.js";
import type { DynamoDBClient } from "~/features/DynamoDBClient/abstractions.js";

export class DynamoDbTableFactoryImpl implements IDynamoDbTableFactory {
    public constructor(private readonly dynamoDBClient: DynamoDBClient.Interface) {}

    public create(params: IDynamoDbTableFactoryCreateParams): IDynamoDbDocumentClient.Interface {
        return new DynamoDbDocumentClient({
            documentClient: this.dynamoDBClient.client,
            tableName: params.name
        });
    }
}
