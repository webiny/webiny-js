import { IFactories } from "./types";
import { DynamoDbElasticsearchSynchronization } from "./dynamoDbElasticsearch/DynamoDbElasticsearchSynchronization";
import { ElasticsearchSynchronization } from "./elasticsearch/ElasticsearchSynchronization";
import { DynamoDbSynchronization } from "./dynamoDb/DynamoDbSynchronization";

export const createFactories = (): IFactories => {
    return {
        createElasticsearch: params => {
            return new ElasticsearchSynchronization(params);
        },
        createDynamoDbElasticsearch: params => {
            return new DynamoDbElasticsearchSynchronization(params);
        },
        createDynamoDb: params => {
            return new DynamoDbSynchronization(params);
        }
    };
};
