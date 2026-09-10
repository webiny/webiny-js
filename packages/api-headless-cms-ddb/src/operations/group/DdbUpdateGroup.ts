import type { CmsGroupStorageOperationsUpdateParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { UpdateGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/UpdateGroupStorageOperation.js";
import { CmsDdbGroupEntity } from "~/abstractions/CmsDdbGroupEntity.js";
import { createKeys, createType } from "./keys.js";

class DdbUpdateGroupImpl implements UpdateGroupStorageOperation.Interface {
    constructor(private entity: CmsDdbGroupEntity.Interface) {}

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
                { error: ex, group, keys }
            );
        }
    }
}

export const DdbUpdateGroup = UpdateGroupStorageOperation.createImplementation({
    implementation: DdbUpdateGroupImpl,
    dependencies: [CmsDdbGroupEntity]
});
