import type {IAuditLog, IStorageItem} from "~/storage/types.js";
import type {IStorageListByCreatedOnParams, IStorageListParams} from "~/storage/abstractions/Storage.js";
import {queryPerPage} from "@webiny/db-dynamodb";
import {BaseAccessPattern} from "~/storage/accessPatterns/BaseAccessPattern.js";
import type {IAccessPatternCreateKeysResult, IAccessPatternListResult} from "~/storage/abstractions/AccessPattern.js";

export class CreatedOnAccessPattern<
    T extends IStorageListByCreatedOnParams = IStorageListByCreatedOnParams
> extends BaseAccessPattern<T> {
    public canHandle(params: IStorageListParams): boolean {
        if (params.app) {
            return false;
        } else if (params.createdBy) {
            return false;
        } else if (params.action) {
            return false;
        } else if (params.entryId) {
            return false;
        } else if (params.version) {
            return false;
        } else if (!params.createdOn_lte && !params.createdOn_gte) {
            return false;
        }
        return true;
    }

    public async list(params: T): Promise<IAccessPatternListResult> {
        const options = this.createOptions(params);
        return await queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: `T#${params.tenant}#AUDIT_LOG#TIME`,
            options
        });
    }

    public createKeys(item: IAuditLog): IAccessPatternCreateKeysResult {
        const time = item.createdOn.getTime();
        return {
            partitionKey: `T#${item.tenant}#AUDIT_LOG#TIME`,
            sortKey: time
        };
    }
}
