import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { IStandardEntityAttributes } from "@webiny/db-dynamodb";
import { createEntity, createTable, standardEntityAttributes } from "@webiny/db-dynamodb";

interface CreateKeysParams {
    scopedKey: string;
}

interface CreateGsiKeysParams {
    scope: string;
    scopedKey: string;
}

export class KeyValueStoreDynamoTable<T> {
    private readonly entity;

    constructor(documentClient: DynamoDBDocument) {
        this.entity = createEntity<IStandardEntityAttributes<T>>({
            name: "KeyValueStore",
            table: createTable({ documentClient }),
            attributes: {
                ...standardEntityAttributes
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
            GSI1_SK: `KEY#${scopedKey}`,
            // TODO @pavel check if we need this
            GSI_TENANT: "webiny#unassigned"
        };
    }

    getEntity() {
        return this.entity;
    }
}
