import { DynamoDBTableType } from "~/types.js";

export const getTableType = (tableName: string): DynamoDBTableType => {
    switch (tableName) {
        case process.env.DB_TABLE:
            return DynamoDBTableType.REGULAR;
        case process.env.DB_TABLE_ELASTICSEARCH:
            return DynamoDBTableType.ELASTICSEARCH;
        case process.env.DB_TABLE_LOG:
            return DynamoDBTableType.LOG;
        default:
            return DynamoDBTableType.UNKNOWN;
    }
};
