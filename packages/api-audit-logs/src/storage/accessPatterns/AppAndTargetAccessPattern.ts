import type { EntityQueryOptions } from "@webiny/db-dynamodb/toolbox.js";
import type { IAuditLog, IStorageItem } from "~/storage/types.js";
import type {
    IStorageListByAppAndTargetParams,
    IStorageListParams
} from "~/storage/abstractions/Storage.js";
import { createStartKey } from "~/storage/startKey.js";
import { queryPerPage } from "@webiny/db-dynamodb";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { BaseAccessPattern } from "~/storage/accessPatterns/BaseAccessPattern.js";
import type {
    IAccessPatternCreateKeysResult,
    IAccessPatternListResult
} from "../abstractions/AccessPattern.js";

export class AppAndTargetAccessPattern<
    T extends IStorageListByAppAndTargetParams = IStorageListByAppAndTargetParams
> extends BaseAccessPattern<T> {
    public canHandle(params: IStorageListParams): boolean {
        if (!params.app) {
            return false;
        } else if (params.createdBy) {
            return false;
        } else if (!params.entryId) {
            return false;
        } else if (params.action) {
            return false;
        }

        return true;
    }

    public async list(params: T): Promise<IAccessPatternListResult> {
        const options: EntityQueryOptions = {
            limit: 25,
            startKey: createStartKey(params),
            index: this.index,
            reverse: params.sort === "DESC"
        };

        const { id: targetEntryId } = parseIdentifier(params.entryId);

        return await queryPerPage<IStorageItem>({
            entity: this.entity,
            partitionKey: `T#${params.tenant}#AUDIT_LOG#APP#${params.app}#TARGET#${targetEntryId}`,
            options
        });
    }

    public createKeys(item: IAuditLog): IAccessPatternCreateKeysResult {
        const { id: targetEntryId, version } = parseIdentifier(item.entityId);
        return {
            partitionKey: `T#${item.tenant}#AUDIT_LOG#APP#${item.app}#TARGET#${targetEntryId}`,
            sortKey: version || 1
        };
    }
}
