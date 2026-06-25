import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";

export interface IDeleteItemKeys {
    PK: string;
    SK: string;
}

export interface IDeleteItemParams {
    client: DynamoDbDocumentClient.Interface;
    keys: IDeleteItemKeys;
}

export const deleteItem = async (params: IDeleteItemParams): Promise<void> => {
    const { client, keys } = params;

    await client.delete(keys);
};
