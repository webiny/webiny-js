import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";

export interface IDeleteItemKeys {
    PK: string;
    SK: string;
}

export interface IDeleteItemParams {
    client: DynamoDocClient;
    keys: IDeleteItemKeys;
}

export const deleteItem = async (params: IDeleteItemParams): Promise<void> => {
    const { client, keys } = params;

    await client.delete(keys);
};
