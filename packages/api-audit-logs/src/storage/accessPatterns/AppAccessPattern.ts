import type { EntityQueryOptions } from "@webiny/db-dynamodb/toolbox.js";
import type { IAuditLog, IStorageItem } from "~/storage/types.js";
import type {
    IStorageListByAppParams,
    IStorageListParams
} from "~/storage/abstractions/Storage.js";
import { createStartKey } from "~/storage/startKey.js";
import { queryPerPage } from "@webiny/db-dynamodb";
import { BaseAccessPattern } from "~/storage/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternListResult
} from "~/storage/abstractions/AccessPattern.js";

export class AppAccessPattern<
    T extends IStorageListByAppParams = IStorageListByAppParams
> extends BaseAccessPattern<T> {
    public canHandle(params: IStorageListParams): boolean {
        if (!params.app) {
            return false;
        } else if (params.createdBy) {
            return false;
        } else if (params.action) {
            return false;
        } else if (params.entryId) {
            return false;
        } else if (params.version) {
            return false;
        }
        return true;
    }

    public async list(params: T): Promise<IAccessPatternListResult> {
        const options: EntityQueryOptions = {
            limit: 25,
            startKey: createStartKey(params),
            index: this.index,
            reverse: params.sort === "DESC"
        };

        return await queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: `T#${params.tenant}#AUDIT_LOG#APP#${params.app}`,
            options
        });
    }

    public createKeys(item: IAuditLog): IAccessPatternCreateKeysResult {
        const time = item.createdOn.getTime();
        return {
            partitionKey: `T#${item.tenant}#AUDIT_LOG#APP#${item.app}`,
            sortKey: time
        };
    }
}
