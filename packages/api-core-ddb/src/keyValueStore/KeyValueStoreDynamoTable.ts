import type { GenericRecord } from "@webiny/api/types.js";
import type { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";

interface CreateKeysParams {
    scopedKey: string;
}

export class KeyValueStoreDynamoTable<T extends GenericRecord> {
    private readonly entity;

    constructor(
        tableFactory: DynamoDbTableFactory.Interface,
        entityFactory: DynamoDbEntityFactory.Interface
    ) {
        const client = tableFactory.create({
            name: process.env.DB_TABLE as string
        });
        this.entity = entityFactory.createGlobal<T>({
            name: "KeyValueStore",
            client
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
