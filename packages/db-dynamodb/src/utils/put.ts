import type { DynamoDocClient } from "~/utils/DynamoDocClient.js";
import type { EntitySchema } from "~/utils/EntitySchema.js";
import type { GenericRecord } from "@webiny/api/types.js";

export type IPutParamsItem<T extends GenericRecord = GenericRecord> = {
    PK: string;
    SK: string;
    [key: string]: any;
} & T;

export interface IPutParams<T extends GenericRecord = GenericRecord> {
    client: DynamoDocClient;
    schema: EntitySchema;
    item: IPutParamsItem<T>;
}

export const put = async <T extends GenericRecord = GenericRecord>(
    params: IPutParams<T>
): Promise<void> => {
    const { client, schema, item } = params;

    const marshalled = schema.marshal(item);
    await client.put(marshalled);
};
