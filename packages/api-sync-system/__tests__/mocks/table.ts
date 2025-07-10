import type { ITable } from "~/sync/types";
import { DynamoDBTableType } from "~/types.js";

export const createRegularMockTable = (params?: ITable): ITable => {
    return {
        name: process.env.DB_TABLE as string,
        type: DynamoDBTableType.REGULAR,
        arn: "arnRegular",
        ...params
    };
};

export const createElasticsearchMockTable = (params?: ITable): ITable => {
    return {
        name: process.env.DB_TABLE_ELASTICSEARCH as string,
        type: DynamoDBTableType.ELASTICSEARCH,
        arn: "arnElasticsearch",
        ...params
    };
};

export const createLogMockTable = (params?: ITable): ITable => {
    return {
        name: process.env.DB_TABLE_LOG as string,
        type: DynamoDBTableType.LOG,
        arn: "arnLog",
        ...params
    };
};
