import type { Entity } from "@webiny/db-dynamodb/toolbox.js";
import type { IAuditLog, IStorageItem } from "~/storage/types.js";
import type { IStorageListDefaultParams } from "~/storage/abstractions/Storage.js";
import { queryPerPage } from "@webiny/db-dynamodb";
import { BaseAccessPattern } from "./BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternListResult
} from "~/storage/abstractions/AccessPattern.js";

export interface IDefaultAccessPatternParams {
    entity: Entity;
}

export class DefaultAccessPattern<
    T extends IStorageListDefaultParams = IStorageListDefaultParams
> extends BaseAccessPattern<T> {
    public constructor(params: IDefaultAccessPatternParams) {
        super({
            index: undefined,
            entity: params.entity
        });
    }

    public canHandle(): boolean {
        /**
         * Default must have always false so it is skipped until the end.
         */
        return false;
    }

    public async list(params: T): Promise<IAccessPatternListResult> {
        const options = this.createOptions({
            limit: params.limit,
            after: params.after,
            sort: params.sort,
            sortKey: undefined
        });

        return await queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: `T#${params.tenant}#AUDIT_LOG`,
            options
        });
    }

    public createKeys(item: IAuditLog): IAccessPatternCreateKeysResult {
        return {
            partitionKey: `T#${item.tenant}#AUDIT_LOG`,
            sortKey: `${item.id}`
        };
    }
}
