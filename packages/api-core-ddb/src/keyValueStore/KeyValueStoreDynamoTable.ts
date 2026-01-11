import type { GenericRecord } from "@webiny/api/types.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createGlobalEntity, createTable, globalEntityAttributes } from "@webiny/db-dynamodb";

interface CreateKeysParams {
    scopedKey: string;
}

interface CreateGsiKeysParams {
    scope: string;
    scopedKey: string;
}

export class KeyValueStoreDynamoTable<T extends GenericRecord> {
    private readonly entity;

    constructor(documentClient: DynamoDBDocument) {
        this.entity = createGlobalEntity<T>({
            name: "KeyValueStore",
            table: createTable({ documentClient }),
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

    createGsiKeys({ scope, scopedKey }: CreateGsiKeysParams) {
        return {
            GSI1_PK: `KV#${scope}`,
            GSI1_SK: `KEY#${scopedKey}`
        };
    }

    getEntity() {
        return this.entity;
    }
}
