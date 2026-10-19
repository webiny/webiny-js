import type { GenericRecord } from "@webiny/api/types.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createGlobalEntity, createTable, globalEntityAttributes } from "@webiny/db-dynamodb";

interface CreateKeysParams {
    scopedKey: string;
}

interface CreateListKeysParams {
    key: string;
    scope: string;
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

    /**
     * Every record of a scope shares one GSI1 partition, sorted by its key, so `list` is a single
     * Query with `begins_with` on the key. The primary key gives each record its own partition and
     * cannot be queried by prefix.
     */
    createListKeys({ key, scope }: CreateListKeysParams) {
        return {
            GSI1_PK: this.createListPartitionKey(scope),
            GSI1_SK: key
        };
    }

    createListPartitionKey(scope: string) {
        return `KV#LIST#${scope}`;
    }

    getEntity() {
        return this.entity;
    }
}
