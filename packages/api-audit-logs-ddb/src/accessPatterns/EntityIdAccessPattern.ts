import type { IAuditLog } from "@webiny/api-audit-logs/storage/types.js";
import type { IStorageListByEntityIdParams } from "@webiny/api-audit-logs/storage/abstractions/Storage.js";
import { BaseAccessPattern } from "~/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/abstractions/AccessPattern.js";
import { parseIdentifier } from "@webiny/utils";

interface ICreatePartitionKeyParams {
    entityId: string;
    tenant: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    const { id } = parseIdentifier(params.entityId);
    return `T#${params.tenant}#AUDIT_LOG#ENTITY_ID#${id}`;
};

export class EntityIdGlobalAccessPattern<
    T extends IStorageListByEntityIdParams = IStorageListByEntityIdParams
> extends BaseAccessPattern<T> {
    public override handles(): IAccessPatternHandles {
        return {
            mustInclude: ["entityId"],
            mustNotInclude: ["entity", "createdBy", "action"]
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
