import type { IAuditLog, IIndexStorageItem } from "~/storage/types.js";
import type { IStorageListByAppCreatedByActionParams } from "~/storage/abstractions/Storage.js";
import { BaseAccessPattern } from "~/storage/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/storage/abstractions/AccessPattern.js";

interface ICreatePartitionKeyParams {
    tenant: string;
    app: string;
    createdBy: string;
    action: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    return `T#${params.tenant}#AUDIT_LOG#APP#${params.app}#CREATEDBY#${params.createdBy}#ACTION#${params.action}`;
};
// GSI8_PK / GSI8_SK
export class AppCreatedByActionAccessPattern<
    T extends IStorageListByAppCreatedByActionParams = IStorageListByAppCreatedByActionParams
> extends BaseAccessPattern<T> {
    public override handles(): IAccessPatternHandles {
        return {
            mustInclude: ["app", "createdBy", "action"],
            mustNotInclude: ["entity", "entityId"]
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
            partitionKey: createPartitionKey({
                ...item,
                createdBy: item.createdBy.id
            }),
            sortKey: time
        };
    }
}
