import type { IAuditLog, IIndexStorageItem } from "~/storage/types.js";
import type { IStorageListByAppEntityActionParams } from "~/storage/abstractions/Storage.js";
import { BaseAccessPattern } from "~/storage/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/storage/abstractions/AccessPattern.js";

interface ICreatePartitionKeyParams {
    tenant: string;
    app: string;
    entity: string;
    action: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    return `T#${params.tenant}#AUDIT_LOG#APP#${params.app}#ENTITY#${params.entity}#ACTION#${params.action}`;
};

export class AppEntityActionAccessPattern<
    T extends IStorageListByAppEntityActionParams = IStorageListByAppEntityActionParams
> extends BaseAccessPattern<T> {
    public override handles(): IAccessPatternHandles {
        return {
            mustInclude: ["app", "entity", "action"],
            mustNotInclude: ["entityId", "createdBy"]
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
