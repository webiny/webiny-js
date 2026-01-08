import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createStandardEntity, createTable } from "@webiny/db-dynamodb";

interface CreateKeysParams {
    scopedKey: string;
}

interface CreateGsiKeysParams {
    scope: string;
    scopedKey: string;
}

export class KeyValueStoreDynamoTable {
    private readonly entity: ReturnType<typeof createStandardEntity>;

    constructor(documentClient: DynamoDBDocument) {
        this.entity = createStandardEntity({
            name: "KeyValueStore",
            table: createTable({ documentClient })
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
