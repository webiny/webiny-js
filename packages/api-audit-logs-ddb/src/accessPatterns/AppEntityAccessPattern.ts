import type { IAuditLog } from "@webiny/api-audit-logs/storage/types.js";
import type { IStorageListByAppEntityParams } from "@webiny/api-audit-logs/storage/abstractions/Storage.js";
import { BaseAccessPattern } from "~/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/abstractions/AccessPattern.js";

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
            mustNotInclude: ["createdBy", "action", "entityId"]
        };
    }

    public async list(params: T): Promise<IAccessPatternListResult> {
        const options = this.createOptions(params);

        const result = await this.query({
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
