import type { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { createEntity } from "~/entity.js";
import type {
    IStorage,
    IStorageFetchParams,
    IStorageFetchResult,
    IStorageListParams,
    IStorageListResult,
    IStorageStoreParams,
    IStorageStoreResult
} from "@webiny/api-audit-logs/storage/abstractions/Storage.js";
import { Converter } from "~/Converter.js";
import { createAccessPatterns } from "~/accessPatterns/index.js";
import { AccessPatternHandler } from "~/AccessPatternHandler.js";
import { ListSuccessResult } from "~/results/index.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

export interface IStorageParams {
    compressionHandler: CompressionHandler.Interface;
    tableFactory: DynamoDbTableFactory.Interface;
    entityFactory: DynamoDbEntityFactory.Interface;
    tableName: string | undefined;
}

export class Storage implements IStorage {
    private readonly entity;
    private readonly converter;
    private readonly patternHandler;

    public constructor(params: IStorageParams) {
        const { entity } = createEntity({
            tableFactory: params.tableFactory,
            entityFactory: params.entityFactory,
            tableName: params.tableName,
            gsiAmount: 10
        });

        this.entity = entity;

        const patterns = createAccessPatterns({
            entity
        });
        this.patternHandler = new AccessPatternHandler({
            patterns
        });

        this.converter = new Converter({
            compressionHandler: params.compressionHandler,
            patternHandler: this.patternHandler
        });
    }

    public async fetch(params: IStorageFetchParams): Promise<IStorageFetchResult> {
        const { id, tenant } = params;

        try {
            const result = await this.entity.get({
                PK: `T#${tenant}#AUDIT_LOG`,
                SK: `${id}`
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

        try {
            const item = await this.converter.oneToStorage(auditLog);
            await this.entity.put(item);
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
        try {
            const result = await this.patternHandler.handle(params);

            return ListSuccessResult.create({
                data: await this.converter.listFromStorage(result.items),
                lastEvaluatedKey: result.lastEvaluatedKey
            });
        } catch (ex) {
            return {
                error: ex,
                success: false
            };
        }
    }
}

export const createStorage = (params: IStorageParams): IStorage => {
    return new Storage(params);
};
