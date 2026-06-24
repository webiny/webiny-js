import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";

export interface GetRecordParamsKeys {
    PK: string;
    SK: string;
}

export interface GetRecordParams {
    client: DynamoDocClient;
    schema: EntitySchema;
    keys: GetRecordParamsKeys;
}

export const get = async <T>(params: GetRecordParams): Promise<T | null> => {
    const { client, keys } = params;

    const result = await client.get<T>(keys);
    return result;
};

export const getClean = async <T>(params: GetRecordParams): Promise<T | null> => {
    const { client, schema, keys } = params;

    const result = await client.get(keys);
    if (!result) {
        return null;
    }

    return schema.unmarshal<T>(result);
};
