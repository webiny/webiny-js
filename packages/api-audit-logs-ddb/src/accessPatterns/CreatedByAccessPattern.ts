import type { IAuditLog } from "@webiny/api-audit-logs/storage/types.js";
import { BaseAccessPattern } from "~/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/abstractions/AccessPattern.js";
import type { IStorageListByCreatedByParams } from "@webiny/api-audit-logs/storage/abstractions/Storage.js";

interface ICreatePartitionKeyParams {
    tenant: string;
    createdBy: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    return `T#${params.tenant}#AUDIT_LOG#CREATEDBY#${params.createdBy}`;
};

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

        const result = await this.query({
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
