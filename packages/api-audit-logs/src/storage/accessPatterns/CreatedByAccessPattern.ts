import type { IAuditLog } from "~/storage/types.js";
import { BaseAccessPattern } from "~/storage/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/storage/abstractions/AccessPattern.js";
import type { IStorageListByCreatedByParams } from "~/storage/abstractions/Storage.js";

interface ICreatePartitionKeyParams {
    tenant: string;
    createdBy: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    return `T#${params.tenant}#AUDIT_LOG#CREATEDBY#${params.createdBy}`;
};

// GSI9_PK / GSI9_SK
export class CreatedByAccessPattern<
    T extends IStorageListByCreatedByParams = IStorageListByCreatedByParams
> extends BaseAccessPattern<T> {
    public override handles(): IAccessPatternHandles {
        return {
            mustInclude: ["createdBy"],
            mustNotInclude: ["app", "action", "entityId", "entity"]
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
            partitionKey: createPartitionKey({
                ...item,
                createdBy: item.createdBy.id
            }),
            sortKey: time
        };
    }
}
