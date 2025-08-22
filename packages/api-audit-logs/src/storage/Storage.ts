import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { AuditLogValues } from "~/types.js";
import { put } from "@webiny/db-dynamodb/utils/put.js";
import { createEntity } from "~/storage/entity.js";

export interface IStorageParams {
    client: DynamoDBDocument;
    tableName: string | undefined;
}

export class Storage {
    private readonly entity;
    private readonly table;

    public constructor(params: IStorageParams) {
        const { entity, table } = createEntity({
            client: params.client,
            tableName: params.tableName,
            gsiAmount: 5
        });
        this.table = table;
        this.entity = entity;
    }

    public async store(item: AuditLogValues): Promise<void> {
        await put({
            entity: this.entity,
            item: {
                PK: `AUDIT_LOG`,
                SK: `${item.id}`,
                GSI1_PK: `TYPE#${item.type}`,
                GSI1_SK: `${item.createdOn}`,
                GSI2_PK: `USER#${item.createdBy.id}`,
                GSI2_SK: `${item.createdOn}`,
                data: {
                    ...item
                }
            }
        });
    }
}
