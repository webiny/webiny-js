import { IFactories } from "./types";
import { DynamoDbElasticsearchSynchronization } from "./dynamoDbElasticsearch/DynamoDbElasticsearchSynchronization";
import { ElasticsearchToDynamoDbSynchronization } from "./elasticsearch/ElasticsearchToDynamoDbSynchronization";
import { DynamoDbSynchronization } from "./dynamoDb/DynamoDbSynchronization";

export const createFactories = (): IFactories => {
    return {
        createElasticsearchToDynamoDb: params => {
            return new ElasticsearchToDynamoDbSynchronization(params);
        },
        createDynamoDbElasticsearch: params => {
            return new DynamoDbElasticsearchSynchronization(params);
        },
        createDynamoDb: params => {
            return new DynamoDbSynchronization(params);
        }
    };
};
