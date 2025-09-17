import type {IAuditLog, IStorageItem} from "~/storage/types.js";
import type {IStorageListByAppEntityParams} from "~/storage/abstractions/Storage.js";
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
    entity: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    return `T#${params.tenant}#AUDIT_LOG#APP#${params.app}#ENTITY#${params.entity}`;
};

export class AppEntityAccessPattern<
    T extends IStorageListByAppEntityParams = IStorageListByAppEntityParams
> extends BaseAccessPattern<T> {
    
    public override handles(): IAccessPatternHandles {
        return {
            mustInclude: ["app", "entity"],
            mustNotInclude: ["createdBy", "action", "entityId", "version"]
        };
    }
    
    public async list(params: T): Promise<IAccessPatternListResult> {
        if(!params.entity) {
            throw new Error("entity is required for this access pattern");
        }
        
        const options = this.createOptions(params);
        
        return queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: createPartitionKey({
                tenant: params.tenant,
                app: params.app,
                entity: params.entity
            }),
            options
        });
    }
    
    public createKeys(item: IAuditLog): IAccessPatternCreateKeysResult {
        if(!item.entity) {
            throw new Error("entity is required to create keys");
        }
        
        const time = item.createdOn.getTime();
        
        return {
            partitionKey: createPartitionKey({
                tenant: item.tenant,
                app: item.app,
                entity: item.entity
            }),
            sortKey: time
        };
    }
}
