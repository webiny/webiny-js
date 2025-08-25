import type { Entity, EntityQueryOptions } from "@webiny/db-dynamodb/toolbox.js";
import type { IAuditLog, IStorageItem } from "~/storage/types.js";
import type {
    IStorageListByAppAndActionParams,
    IStorageListParams,
    IStorageListSuccessResult
} from "~/storage/abstractions/Storage.js";
import { createStartKey } from "~/storage/startKey.js";
import { queryPerPage } from "@webiny/db-dynamodb";
import type { IConverter } from "~/storage/abstractions/Converter.js";
import { BaseAccessPattern } from "~/storage/accessPatterns/BaseAccessPattern.js";
import { ListSuccessResult } from "~/storage/results/index.js";
import type { IAccessPatternCreateKeysResult } from "../abstractions/AccessPattern.js";

export interface IAppAndActionAccessPatternParams {
    index: string;
    converter: IConverter;
    entity: Entity;
}

export class AppAndActionAccessPattern<
    T extends IStorageListByAppAndActionParams = IStorageListByAppAndActionParams
> extends BaseAccessPattern<T> {
    private readonly entity;
    private readonly converter: IConverter;

    public constructor(params: IAppAndActionAccessPatternParams) {
        super(params);
        this.entity = params.entity;
        this.converter = params.converter;
    }

    public canHandle(params: IStorageListParams): boolean {
        if (!params.app) {
            return false;
        } else if (!params.action) {
            return false;
        } else if (params.id) {
            return false;
        } else if (params.createdBy) {
            return false;
        } else if (params.entryId) {
            return false;
        } else if (params.version) {
            return false;
        }
        return true;
    }

    public async list(params: T): Promise<IStorageListSuccessResult> {
        const options: EntityQueryOptions = {
            limit: 25,
            startKey: createStartKey(params),
            index: this.index,
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

    public createKeys(item: IAuditLog): IAccessPatternCreateKeysResult {
        const time = item.createdOn.getTime();
        return {
            partitionKey: `T#${item.tenant}#AUDIT_LOG#APP#${item.app}#ACTION#${item.action}`,
            sortKey: time
        };
    }
}
