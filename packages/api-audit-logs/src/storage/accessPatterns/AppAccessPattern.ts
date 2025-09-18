import type { IAuditLog, IIndexStorageItem } from "~/storage/types.js";
import type { IStorageListByAppParams } from "~/storage/abstractions/Storage.js";
import { BaseAccessPattern } from "~/storage/accessPatterns/BaseAccessPattern.js";
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
};

export class AppAccessPattern<
    T extends IStorageListByAppParams = IStorageListByAppParams
> extends BaseAccessPattern<T> {
    public override handles(): IAccessPatternHandles {
        return {
            mustInclude: ["app"],
            mustNotInclude: ["createdBy", "action", "entityId", "entity"]
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
