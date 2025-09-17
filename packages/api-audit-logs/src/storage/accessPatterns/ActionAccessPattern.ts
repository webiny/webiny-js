import type {IAuditLog} from "~/storage/types.js";
import type {IStorageListByActionParams} from "~/storage/abstractions/Storage.js";
import {BaseAccessPattern} from "~/storage/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/storage/abstractions/AccessPattern.js";

interface ICreatePartitionKeyParams {
    tenant: string;
    action: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    return `T#${params.tenant}#AUDIT_LOG#ACTION#${params.action}`;
};

export class ActionAccessPattern<
    T extends IStorageListByActionParams = IStorageListByActionParams
> extends BaseAccessPattern<T> {
    
    public override handles(): IAccessPatternHandles {
        return {
            mustInclude: ["action"],
            mustNotInclude: ["app", "entity", "entityId", "createdBy", "version"]
        };
    }
    
    public async list(params: T): Promise<IAccessPatternListResult> {
        const options = this.createOptions(params);
        
        return this.query({
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
