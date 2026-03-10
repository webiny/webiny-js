import { DynamoDBTableType } from "~/types.js";

export const getTableType = (tableName: string): DynamoDBTableType => {
    switch (tableName) {
        case process.env.DB_TABLE:
            return DynamoDBTableType.REGULAR;
        case process.env.DB_TABLE_OPENSEARCH:
            return DynamoDBTableType.OPENSEARCH;
        default:
            return DynamoDBTableType.UNKNOWN;
    }
};
