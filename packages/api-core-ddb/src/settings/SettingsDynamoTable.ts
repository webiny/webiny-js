import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createStandardEntity, createTable } from "@webiny/db-dynamodb";

interface CreateKeysParams {
    tenant: string;
    name: string;
}

export class SettingsDynamoTable {
    private readonly entity: ReturnType<typeof createStandardEntity>;

    constructor(documentClient: DynamoDBDocument) {
        this.entity = createStandardEntity({
            name: "Settings",
            table: createTable({ documentClient })
        });
    }

    createKeys({ tenant, name }: CreateKeysParams) {
        return {
            PK: `T#${tenant}#SETTINGS#${name}`,
            SK: `A`
        };
    }

    createGsiKeys({ tenant, name }: CreateKeysParams) {
        return {
            GSI1_PK: `T#${tenant}#SETTINGS`,
            GSI1_SK: name
        };
    }

    getEntity() {
        return this.entity;
    }
}
