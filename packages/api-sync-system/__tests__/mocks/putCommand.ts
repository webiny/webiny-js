import { PutCommand } from "@webiny/aws-sdk/client-dynamodb/index.js";

export interface ICreateMockPutCommandParams {
    TableName?: string;
    Item?: Record<string, string>;
}

export const createMockPutCommand = (params: ICreateMockPutCommandParams = {}) => {
    return new PutCommand({
        TableName: params.TableName || process.env.DB_TABLE,
        Item: params.Item || {
            PK: "pk1",
            SK: "sk1"
        }
    });
};
