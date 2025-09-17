import type { IAuditLog, IIndexStorageItem } from "~/storage/types.js";
import type { IStorageListByAppAndActionParams } from "~/storage/abstractions/Storage.js";
import { BaseAccessPattern } from "~/storage/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/storage/abstractions/AccessPattern.js";

interface ICreatePartitionKeyParams {
    tenant: string;
    app: string;
    action: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    return `T#${params.tenant}#AUDIT_LOG#APP#${params.app}#ACTION#${params.action}`;
};

// GSI6_PK / GSI6_SK
export class AppActionAccessPattern<
    T extends IStorageListByAppAndActionParams = IStorageListByAppAndActionParams
> extends BaseAccessPattern<IStorageListByAppAndActionParams> {
    public override handles(): IAccessPatternHandles {
        return {
            mustInclude: ["app", "action"],
            mustNotInclude: ["entity", "entityId", "createdBy"]
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
