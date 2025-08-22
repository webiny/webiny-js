import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { AuditLogValues } from "~/types.js";
import { put } from "@webiny/db-dynamodb/utils/put.js";
import { getClean } from "@webiny/db-dynamodb/utils/get.js";
import { createEntity } from "~/storage/entity.js";
import type {
    IStorage,
    IStorageFetchParams,
    IStorageFetchResult,
    IStorageStoreParams,
    IStorageStoreResult
} from "~/storage/abstractions/IStorage.js";
import type { Topic } from "@webiny/pubsub/types.js";

export interface IStorageParams {
    client: DynamoDBDocument;
    tableName: string | undefined;
    onBeforeCreate: Topic<any>;
    onBeforeUpdate: Topic<any>;
}

interface IStorageItem {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
    GSI2_PK: string;
    GSI2_SK: string;
    GSI3_PK: string;
    GSI3_SK: string;
    GSI4_PK: string;
    GSI4_SK: string;
    GSI5_PK: string;
    GSI5_SK: string;

    data: AuditLogValues;
}

export class Storage implements IStorage {
    private readonly entity;
    private readonly table;
    private readonly onBeforeCreate;
    private readonly onBeforeUpdate;

    public constructor(params: IStorageParams) {
        const { entity, table } = createEntity({
            client: params.client,
            tableName: params.tableName,
            gsiAmount: 5
        });
        this.table = table;
        this.entity = entity;
        this.onBeforeCreate = params.onBeforeCreate;
        this.onBeforeUpdate = params.onBeforeUpdate;
    }

    public async fetch(params: IStorageFetchParams): Promise<IStorageFetchResult> {
        const { id } = params;

        try {
            const result = await getClean<IStorageItem>({
                entity: this.entity,
                keys: {
                    PK: `AUDIT_LOG`,
                    SK: `${id}`
                }
            });
            if (!result) {
                return {
                    error: new Error(`Audit log entry "${id}" not found.`),
                    success: false
                };
            }
            return {
                data: result.data,
                success: true
            };
        } catch (ex) {
            return {
                error: ex,
                success: false
            };
        }
    }

    public async store(params: IStorageStoreParams): Promise<IStorageStoreResult> {
        const data = structuredClone(params.data);

        try {
            await put({
                entity: this.entity,
                item: {
                    PK: `AUDIT_LOG`,
                    SK: `${data.id}`,
                    // By Log Type
                    GSI1_PK: "AUDIT_LOG#TYPE",
                    GSI1_SK: `${data.type}`,
                    GSI2_PK: `AUDIT_LOG#USER`,
                    GSI2_SK: `${data.createdBy.id}`,
                    GSI3_PK: `AUDIT_LOG#DATE`,
                    GSI3_SK: `${data.createdOn.getTime()}`,
                    GSI4_PK: "AUDIT_LOG#ACTION",
                    GSI4_SK: `${data.data.action}`,
                    GSI5_PK: `AUDIT_LOG#ENTITY`,
                    GSI5_SK: `${data.data.entityId}`,
                    data: {
                        ...data
                    }
                }
            });
        } catch (ex) {
            return {
                error: ex,
                success: false
            };
        }

        return {
            success: true,
            data
        };
    }
}
