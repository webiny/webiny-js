import type {IAuditLog, IStorageItem} from "~/storage/types.js";
import type {IStorageListByEntityIdParams} from "~/storage/abstractions/Storage.js";
import {queryPerPage} from "@webiny/db-dynamodb";
import {BaseAccessPattern} from "~/storage/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/storage/abstractions/AccessPattern.js";
import {parseIdentifier} from "@webiny/utils";

interface ICreatePartitionKeyParams {
    entityId: string;
    tenant: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    const {id} = parseIdentifier(params.entityId);
    return `T#${params.tenant}#AUDIT_LOG#ENTRY_ID#${id}`;
};

export class EntityIdGlobalAccessPattern<
    T extends IStorageListByEntityIdParams = IStorageListByEntityIdParams
> extends BaseAccessPattern<T> {
    
    public override handles(): IAccessPatternHandles {
        return {
            mustInclude: ["entityId"],
            mustNotInclude: ["app", "entity", "createdBy", "action", "version"]
        };
    }
    
    public async list(params: T): Promise<IAccessPatternListResult> {
        const options = this.createOptions(params);
        
        return queryPerPage<IStorageItem>({
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
