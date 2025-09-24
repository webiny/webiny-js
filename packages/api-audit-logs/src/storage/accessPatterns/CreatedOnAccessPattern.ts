import type { IAuditLog, IIndexStorageItem } from "~/storage/types.js";
import { BaseAccessPattern } from "~/storage/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/storage/abstractions/AccessPattern.js";
import type { IStorageListByCreatedOnParams } from "~/storage/abstractions/Storage.js";

interface ICreatePartitionKeyParams {
    tenant: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    return `T#${params.tenant}#AUDIT_LOG#CREATED_ON`;
};

export class CreatedOnAccessPattern<
    T extends IStorageListByCreatedOnParams = IStorageListByCreatedOnParams
> extends BaseAccessPattern<T> {
    public override handles(): IAccessPatternHandles {
        return {
            shouldInclude: ["createdOn_gte", "createdOn_lte"],
            mustInclude: [],
            mustNotInclude: ["app", "createdBy", "action", "entityId", "entity"]
        };
    }

    public async list(params: T): Promise<IAccessPatternListResult> {
        const options = this.createOptions(params);

        const result = await this.query<IIndexStorageItem>({
            partitionKey: createPartitionKey(params),
            options
        });
        return this.populateResult(result);
    }

    public createKeys(item: IAuditLog): IAccessPatternCreateKeysResult {
        const time = item.createdOn.getTime();

        return {
            partitionKey: createPartitionKey(item),
            sortKey: time
        };
    }
}
