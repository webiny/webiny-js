import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { put } from "@webiny/db-dynamodb/utils/put.js";
import { getClean } from "@webiny/db-dynamodb/utils/get.js";
import { createEntity } from "~/storage/entity.js";
import type {
    IStorage,
    IStorageFetchParams,
    IStorageFetchResult,
    IStorageListParams,
    IStorageListResult,
    IStorageStoreParams,
    IStorageStoreResult
} from "~/storage/abstractions/Storage.js";
import type { IStorageItem } from "~/storage/types.js";
import type { ICompressor } from "@webiny/utils/compression/index.js";
import { Converter } from "~/storage/Converter.js";
import { createAccessPatterns } from "~/storage/accessPatterns/index.js";
import { AccessPatternHandler } from "~/storage/AccessPatternHandler.js";
import { ListSuccessResult } from "~/storage/results/index.js";

export interface IStorageParams {
    compressor: ICompressor;
    client: DynamoDBDocument;
    tableName: string | undefined;
}

export class Storage implements IStorage {
    private readonly entity;
    private readonly converter;
    private readonly patternHandler;

    public constructor(params: IStorageParams) {
        const { entity } = createEntity({
            client: params.client,
            tableName: params.tableName,
            gsiAmount: 5
        });

        this.entity = entity;

        const patterns = createAccessPatterns({
            entity: this.entity
        });
        this.patternHandler = new AccessPatternHandler({
            patterns
        });

        this.converter = new Converter({
            compressor: params.compressor,
            patternHandler: this.patternHandler
        });
    }

    public async fetch(params: IStorageFetchParams): Promise<IStorageFetchResult> {
        const { id, tenant } = params;

        try {
            const result = await getClean<IStorageItem>({
                entity: this.entity,
                keys: {
                    PK: `T#${tenant}#AUDIT_LOG`,
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
