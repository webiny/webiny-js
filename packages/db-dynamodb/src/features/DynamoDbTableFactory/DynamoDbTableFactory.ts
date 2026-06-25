import { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/DynamoDbDocumentClient.js";
import type { IDynamoDbTableFactory } from "./abstractions.js";
import type { IDynamoDbTableFactoryCreateParams } from "./abstractions.js";
import type { DynamoDBClient } from "~/feature/DynamoDBClient/abstractions.js";

export class DynamoDbTableFactoryImpl implements IDynamoDbTableFactory {
    public constructor(private readonly dynamoDBClient: DynamoDBClient.Interface) {}

    public create(params: IDynamoDbTableFactoryCreateParams): DynamoDbDocumentClient {
        return new DynamoDbDocumentClient({
            documentClient: this.dynamoDBClient.client,
            tableName: params.name
        });
    }
}
