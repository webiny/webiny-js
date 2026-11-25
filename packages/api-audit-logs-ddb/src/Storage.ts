import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
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
import type { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

export interface IStorageParams {
    compressionHandler: CompressionHandler.Interface;
    client: DynamoDBDocument;
    tableName: string | undefined;
    /** The tenant the storage acts on: its tenant scope's. */
    scopeTenant: ScopeTenant.Interface;
}

/**
 * The entity, built once per client and table: the storage itself is built per tenant scope.
 */
const entities = new WeakMap<DynamoDBDocument, Map<string, ReturnType<typeof createEntity>>>();

const getEntity = (client: DynamoDBDocument, tableName: string | undefined) => {
    let byTable = entities.get(client);
    if (!byTable) {
        byTable = new Map();
        entities.set(client, byTable);
    }
    const key = tableName ?? "";
    let created = byTable.get(key);
    if (!created) {
        created = createEntity({ client, tableName, gsiAmount: 10 });
        byTable.set(key, created);
    }
    return created;
};

export class Storage implements IStorage {
    private readonly entity;
    private readonly converter;
    private readonly patternHandler;
    private readonly scopeTenant: ScopeTenant.Interface;

    public constructor(params: IStorageParams) {
        const { entity } = getEntity(params.client, params.tableName);

        this.entity = entity;
        this.scopeTenant = params.scopeTenant;

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
        const { id } = params;

        try {
            const tenant = this.scopeTenant.getId(params.tenant);
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
            // Stored with its scope's tenant, checked against the one it carries.
            auditLog.tenant = this.scopeTenant.getId(auditLog.tenant);
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
            const result = await this.patternHandler.handle({
                ...params,
                tenant: this.scopeTenant.getId(params.tenant)
            });

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
