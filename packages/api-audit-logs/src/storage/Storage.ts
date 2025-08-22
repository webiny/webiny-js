import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
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
import type { IAuditLog, IStorageAuditLog } from "~/storage/types.js";
import type { ICompressor } from "@webiny/utils/compression/index.js";

export interface IStorageParams {
    compressor: ICompressor;
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

    data: IStorageAuditLog;
}

export class Storage implements IStorage {
    private readonly entity;
    private readonly table;
    private readonly onBeforeCreate;
    private readonly onBeforeUpdate;
    private readonly compressor;

    public constructor(params: IStorageParams) {
        const { entity, table } = createEntity({
            client: params.client,
            tableName: params.tableName,
            gsiAmount: 5
        });
        this.compressor = params.compressor;
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
                data: await this.fromStorage(result.data),
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
        const auditLog = structuredClone(params.data);

        await this.onBeforeCreate.publish({
            auditLog
        });
        const time = auditLog.createdOn.getTime();
        try {
            await put({
                entity: this.entity,
                item: {
                    PK: `T#${auditLog.tenant}#AUDIT_LOG`,
                    SK: `${auditLog.id}`,
                    // By Log Type
                    GSI1_PK: `T#${auditLog.tenant}#AUDIT_LOG#APP#${auditLog.app}`,
                    GSI1_SK: time,
                    GSI2_PK: `T#${auditLog.tenant}#AUDIT_LOG#USER#${auditLog.createdBy.id}`,
                    GSI2_SK: time,
                    GSI3_PK: `T#${auditLog.tenant}#AUDIT_LOG#TIME`,
                    GSI3_SK: time,
                    GSI4_PK: `T#${auditLog.tenant}#AUDIT_LOG#ACTION#${auditLog.app}#${auditLog.action}`,
                    GSI4_SK: time,
                    GSI5_PK: `T#${auditLog.tenant}#AUDIT_LOG#TARGET`,
                    GSI5_SK: `${auditLog.targetId}`,
                    data: await this.toStorage(auditLog)
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
            data: auditLog
        };
    }

    private async toStorage(auditLog: IAuditLog): Promise<IStorageAuditLog> {
        return {
            ...auditLog,
            content: JSON.stringify(await this.compressor.compress(auditLog.content)),
            createdOn: auditLog.createdOn.toISOString()
        };
    }

    private async fromStorage(auditLog: IStorageAuditLog): Promise<IAuditLog> {
        return {
            ...auditLog,
            content: await this.compressor.decompress(JSON.parse(auditLog.content)),
            createdOn: new Date(auditLog.createdOn)
        };
    }
}
