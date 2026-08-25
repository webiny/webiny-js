import type { CmsGroupStorageOperationsGetParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { GetGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/GetGroupStorageOperation.js";
import { CmsDdbGroupEntity } from "~/abstractions/CmsDdbGroupEntity.js";
import { createKeys } from "./keys.js";

class DdbGetGroupImpl implements GetGroupStorageOperation.Interface {
    constructor(private entity: CmsDdbGroupEntity.Interface) {}

    async execute(params: CmsGroupStorageOperationsGetParams) {
        const keys = createKeys(params);
        try {
            const result = await this.entity.get(keys);
            return result?.data || null;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get group.",
                ex.code || "GET_GROUP_ERROR",
                { error: ex, ...params, keys }
            );
        }
    }
}

export const DdbGetGroup = GetGroupStorageOperation.createImplementation({
    implementation: DdbGetGroupImpl,
    dependencies: [CmsDdbGroupEntity]
});
