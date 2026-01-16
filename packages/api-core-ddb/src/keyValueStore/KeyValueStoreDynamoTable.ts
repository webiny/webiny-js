import type { GenericRecord } from "@webiny/api/types.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createGlobalEntity, createTable, globalEntityAttributes } from "@webiny/db-dynamodb";

interface CreateKeysParams {
    scopedKey: string;
}

export class KeyValueStoreDynamoTable<T extends GenericRecord> {
    private readonly entity;

    constructor(documentClient: DynamoDBDocument) {
        const table = createTable({
            name: process.env.DB_TABLE as string,
            documentClient
        });
        this.entity = createGlobalEntity<T>({
            name: "KeyValueStore",
            table: table.table,
            attributes: {
                ...globalEntityAttributes
            }
        });
    }

    createKeys({ scopedKey }: CreateKeysParams) {
        return {
            PK: `KV#${scopedKey}`,
            SK: `A`
        };
    }

    getEntity() {
        return this.entity;
    }
}
