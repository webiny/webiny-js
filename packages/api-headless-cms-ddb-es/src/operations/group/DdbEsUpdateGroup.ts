import type { CmsGroupStorageOperationsUpdateParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { UpdateGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/UpdateGroupStorageOperation.js";
import { CmsDdbEsGroupEntity } from "~/abstractions/CmsDdbEsGroupEntity.js";
import { createKeys, createType } from "./keys.js";

class DdbEsUpdateGroupImpl implements UpdateGroupStorageOperation.Interface {
    constructor(private entity: CmsDdbEsGroupEntity.Interface) {}

    async execute(params: CmsGroupStorageOperationsUpdateParams) {
        const { group } = params;
        const keys = createKeys(group);
        try {
            await this.entity.put({
                data: group,
                TYPE: createType(),
                ...keys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update group.",
                ex.code || "UPDATE_GROUP_ERROR",
                {
                    error: ex,
                    group,
                    keys
                }
            );
        }
    }
}

export const DdbEsUpdateGroup = UpdateGroupStorageOperation.createImplementation({
    implementation: DdbEsUpdateGroupImpl,
    dependencies: [CmsDdbEsGroupEntity]
});
