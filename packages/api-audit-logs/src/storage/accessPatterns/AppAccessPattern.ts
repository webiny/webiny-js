import type {IAuditLog, IStorageItem} from "~/storage/types.js";
import type {IStorageListByAppParams} from "~/storage/abstractions/Storage.js";
import {queryPerPage} from "@webiny/db-dynamodb";
import {BaseAccessPattern} from "~/storage/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/storage/abstractions/AccessPattern.js";

interface ICreatePartitionKeyParams {
    tenant: string;
    app: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    return `T#${params.tenant}#AUDIT_LOG#APP#${params.app}`;
}

export class AppAccessPattern<
    T extends IStorageListByAppParams = IStorageListByAppParams
> extends BaseAccessPattern<T> {
    
    public override handles(): IAccessPatternHandles {
        return {
            mustInclude: ["app"],
            mustNotInclude: [
                "createdBy",
                "action",
                "entryId",
                "version",
            ]
        }
    }
    // public canHandle(params: IStorageListParams): boolean {
    //     if (!params.app) {
    //         return false;
    //     } else if (params.createdBy) {
    //         return false;
    //     } else if (params.action) {
    //         return false;
    //     } else if (params.entryId) {
    //         return false;
    //     } else if (params.version) {
    //         return false;
    //     }
    //     return true;
    // }

    public async list(params: T): Promise<IAccessPatternListResult> {
        const options = this.createOptions(params)

        return await queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: createPartitionKey(params),
            options
        });
    }

    public createKeys(item: IAuditLog): IAccessPatternCreateKeysResult {
        const time = item.createdOn.getTime();
        return {
            partitionKey: createPartitionKey(item),
            sortKey: time
        };
    }
}
