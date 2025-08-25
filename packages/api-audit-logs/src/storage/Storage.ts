import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { put } from "@webiny/db-dynamodb/utils/put.js";
import { getClean } from "@webiny/db-dynamodb/utils/get.js";
import { createEntity } from "~/storage/entity.js";
import type {
    IStorage,
    IStorageFetchParams,
    IStorageFetchResult,
    IStorageListByAppAndActionParams,
    IStorageListByAppParams,
    IStorageListByCreatedByParams,
    IStorageListByCreatedOnParams,
    IStorageListDefaultParams,
    IStorageListParams,
    IStorageListResult,
    IStorageListSuccessResult,
    IStorageStoreParams,
    IStorageStoreResult
} from "~/storage/abstractions/IStorage.js";
import type { Topic } from "@webiny/pubsub/types.js";
import type { IAuditLog, IStorageItem } from "~/storage/types.js";
import type { ICompressor } from "@webiny/utils/compression/index.js";
import { queryPerPage } from "@webiny/db-dynamodb";
import type { EntityQueryOptions } from "@webiny/db-dynamodb/toolbox.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { ListSuccessResult } from "~/storage/ListSuccessResult.js";
import type { IConverter } from "~/storage/abstractions/IConverter.js";
import { Converter } from "~/storage/Converter.js";
import { createStartKey } from "~/storage/startKey.js";

export interface IStorageParams {
    compressor: ICompressor;
    client: DynamoDBDocument;
    tableName: string | undefined;
    onBeforeCreate: Topic<any>;
    onBeforeUpdate: Topic<any>;
}

interface ICreateListSuccessResult {
    data: IAuditLog[];
    lastEvaluatedKey?: GenericRecord;
}

export class Storage implements IStorage {
    private readonly entity;
    private readonly table;
    private readonly onBeforeCreate;
    private readonly onBeforeUpdate;
    private readonly converter: IConverter;

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
        this.converter = new Converter(params.compressor);
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
                data: await this.converter.oneFromStorage(result),
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
            const item = await this.converter.oneToStorage(auditLog);
            await put({
                entity: this.entity,
                item
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

    public async list(params: IStorageListParams): Promise<IStorageListResult> {
        const {
            version,
            app,
            action,
            createdBy,
            tenant,
            createdOn_gte,
            createdOn_lte,
            entryId,
            order
        } = params;

        /**
         * List by App.
         * GSI 1
         */
        if (app && !action) {
            return this.listByApp({
                tenant,
                app,
                order
            });
        }
        /**
         * List by time.
         * GSI 2
         */
        //
        else if (createdOn_gte || createdOn_lte) {
            return this.listByCreatedOn({
                tenant,
                createdOn_gte,
                createdOn_lte,
                order
            });
        }
        /**
         * List by Created By.
         * GSI 3
         */
        //
        else if (createdBy) {
            return this.listByCreatedBy({
                tenant,
                createdBy,
                createdOn_lte,
                createdOn_gte,
                order
            });
        }

        return this.listDefault({
            tenant
        });
    }

    private async listByCreatedOn(
        params: IStorageListByCreatedOnParams
    ): Promise<IStorageListSuccessResult> {
        const options: EntityQueryOptions = {
            limit: 25,
            startKey: createStartKey(params),
            index: "GSI4",
            reverse: params.order === "DESC"
        };

        const result = await queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: `T#${params.tenant}#AUDIT_LOG#TIME`,
            options
        });

        return ListSuccessResult.create({
            data: await this.converter.listFromStorage(result.items),
            lastEvaluatedKey: result.lastEvaluatedKey
        });
    }

    private async listByCreatedBy(
        params: IStorageListByCreatedByParams
    ): Promise<IStorageListSuccessResult> {
        const options: EntityQueryOptions = {
            limit: 25,
            startKey: createStartKey(params),
            index: "GSI3",
            reverse: params.order === "DESC"
        };
        const result = await queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: `T#${params.tenant}#AUDIT_LOG#USER#${params.createdBy.id}`,
            options
        });

        return ListSuccessResult.create({
            data: await this.converter.listFromStorage(result.items),
            lastEvaluatedKey: result.lastEvaluatedKey
        });
    }

    private async listByAppAndAction(
        params: IStorageListByAppAndActionParams
    ): Promise<IStorageListSuccessResult> {
        const options: EntityQueryOptions = {
            limit: 25,
            startKey: createStartKey(params),
            index: "GSI2",
            reverse: params.order === "DESC"
        };

        const result = await queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: `T#${params.tenant}#AUDIT_LOG#APP#${params.app}#ACTION#${params.action}`,
            options
        });

        return ListSuccessResult.create({
            data: await this.converter.listFromStorage(result.items),
            lastEvaluatedKey: result.lastEvaluatedKey
        });
    }

    private async listByApp(params: IStorageListByAppParams): Promise<IStorageListSuccessResult> {
        const options: EntityQueryOptions = {
            limit: 25,
            startKey: createStartKey(params),
            index: "GSI1",
            reverse: params.order === "DESC"
        };

        const result = await queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: `T#${params.tenant}#AUDIT_LOG#APP#${params.app}`,
            options
        });

        return ListSuccessResult.create({
            data: await this.converter.listFromStorage(result.items),
            lastEvaluatedKey: result.lastEvaluatedKey
        });
    }

    private async listDefault(
        params: IStorageListDefaultParams
    ): Promise<IStorageListSuccessResult> {
        const options: EntityQueryOptions = {
            limit: 25,
            startKey: createStartKey(params)
        };

        const result = await queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: `T#${params.tenant}#AUDIT_LOG`,
            options
        });

        return ListSuccessResult.create({
            data: await this.converter.listFromStorage(result.items),
            lastEvaluatedKey: result.lastEvaluatedKey
        });
    }
}
