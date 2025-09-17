import type { Entity } from "@webiny/db-dynamodb/toolbox.js";
import type { IAuditLog } from "~/storage/types.js";
import type { IStorageListDefaultParams } from "~/storage/abstractions/Storage.js";
import { BaseAccessPattern } from "./BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternHandles,
    IAccessPatternListResult
} from "~/storage/abstractions/AccessPattern.js";

export interface IDefaultAccessPatternParams {
    entity: Entity;
}

interface ICreatePartitionKeyParams {
    tenant: string;
}

const createPartitionKey = (params: ICreatePartitionKeyParams) => {
    return `T#${params.tenant}#AUDIT_LOG`;
};

export class DefaultAccessPattern<
    T extends IStorageListDefaultParams = IStorageListDefaultParams
> extends BaseAccessPattern<T> {
    public constructor(params: IDefaultAccessPatternParams) {
        super({
            index: undefined,
            entity: params.entity
        });
    }

    public override handles(): IAccessPatternHandles {
        return {
            mustInclude: [],
            mustNotInclude: []
        };
    }

    public override canHandle(): boolean {
        return false;
    }

    public async list(params: T): Promise<IAccessPatternListResult> {
        const options = this.createOptions(params);

        return await this.query({
            partitionKey: createPartitionKey(params),
            options
        });
    }

    public createKeys(item: IAuditLog): IAccessPatternCreateKeysResult {
        return {
            partitionKey: createPartitionKey(item),
            sortKey: `${item.id}`
        };
    }
}
