import type { Entity, EntityQueryOptions } from "@webiny/db-dynamodb/toolbox.js";
import type { IAuditLog, IStorageItem } from "~/storage/types.js";
import type {
    IStorageListDefaultParams,
    IStorageListSuccessResult
} from "~/storage/abstractions/Storage.js";
import { createStartKey } from "~/storage/startKey.js";
import { queryPerPage } from "@webiny/db-dynamodb";
import type { IConverter } from "~/storage/abstractions/Converter.js";
import { BaseAccessPattern } from "./BaseAccessPattern.js";
import { ListSuccessResult } from "~/storage/results/index.js";
import type { IAccessPatternCreateKeysResult } from "~/storage/abstractions/AccessPattern.js";

export interface IDefaultAccessPatternParams {
    converter: IConverter;
    entity: Entity;
}

export class DefaultAccessPattern<
    T extends IStorageListDefaultParams = IStorageListDefaultParams
> extends BaseAccessPattern<T> {
    private readonly entity;
    private readonly converter: IConverter;

    public constructor(params: IDefaultAccessPatternParams) {
        super({
            index: undefined
        });
        this.entity = params.entity;
        this.converter = params.converter;
    }

    public canHandle(): boolean {
        /**
         * Default must have always false so it is skipped until the end.
         */
        return false;
    }

    public async list(params: T): Promise<IStorageListSuccessResult> {
        const options: EntityQueryOptions = {
            limit: 25,
            startKey: createStartKey(params),
            reverse: params.order === "DESC"
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

    public createKeys(item: IAuditLog): IAccessPatternCreateKeysResult {
        return {
            partitionKey: `T#${item.tenant}#AUDIT_LOG`,
            sortKey: `${item.id}`
        };
    }
}
