import type { CmsGroupStorageOperationsDeleteParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { DeleteGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/DeleteGroupStorageOperation.js";
import { CmsDdbEsGroupEntity } from "~/abstractions/CmsDdbEsGroupEntity.js";
import { createKeys } from "./keys.js";

class DdbEsDeleteGroupImpl implements DeleteGroupStorageOperation.Interface {
    constructor(private entity: CmsDdbEsGroupEntity.Interface) {}

    async execute(params: CmsGroupStorageOperationsDeleteParams) {
        const { group } = params;
        const keys = createKeys(group);
        try {
            await this.entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete group.",
                ex.code || "DELETE_GROUP_ERROR",
                {
                    error: ex,
                    group,
                    keys
                }
            );
        }
    }
}

export const DdbEsDeleteGroup = DeleteGroupStorageOperation.createImplementation({
    implementation: DdbEsDeleteGroupImpl,
    dependencies: [CmsDdbEsGroupEntity]
});
