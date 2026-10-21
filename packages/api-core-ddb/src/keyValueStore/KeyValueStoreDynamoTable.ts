import type { GenericRecord } from "@webiny/api/types.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createGlobalEntity, createTable, globalEntityAttributes } from "@webiny/db-dynamodb";

interface CreateKeysParams {
    scopedKey: string;
}

interface CreateListKeysParams {
    key: string;
    scope: string;
    collection: string;
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
     * GSI1 keys for a member of a collection. Each collection is its own GSI1 partition, sorted by
     * key, so `list` is one Query on it. A record outside every collection gets no GSI1 keys at all
     * and costs the index nothing. The primary key gives each record its own partition, which a
     * Query cannot list.
     */
    createListKeys({ key, scope, collection }: CreateListKeysParams) {
        return {
            GSI1_PK: this.createListPartitionKey(scope, collection),
            GSI1_SK: this.createListSortKey(key)
        };
    }

    /**
     * The scope's length goes in front so the key reads back one way only: without it, scope `a#b`
     * with collection `c` and scope `a` with collection `b#c` would share a partition, and a list
     * in one scope would return another scope's records.
     */
    createListPartitionKey(scope: string, collection: string) {
        return `KV#COL#${scope.length}#${scope}#${collection}`;
    }

    /** Prefixed because DynamoDB rejects an empty string as an index key, and `""` is a valid key. */
    createListSortKey(key: string) {
        return `K#${key}`;
    }

    parseListSortKey(sortKey: string) {
        return sortKey.slice("K#".length);
    }

    getEntity() {
        return this.entity;
    }
}
