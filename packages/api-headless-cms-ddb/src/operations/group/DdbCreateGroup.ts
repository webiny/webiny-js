import type { CmsGroupStorageOperationsCreateParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { CreateGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/CreateGroupStorageOperation.js";
import { CmsDdbGroupEntity } from "~/abstractions/CmsDdbGroupEntity.js";
import { createKeys, createType } from "./keys.js";

class DdbCreateGroupImpl implements CreateGroupStorageOperation.Interface {
    constructor(private entity: CmsDdbGroupEntity.Interface) {}

    async execute(params: CmsGroupStorageOperationsCreateParams) {
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
                ex.message || "Could not create group.",
                ex.code || "CREATE_GROUP_ERROR",
                { error: ex, group, keys }
            );
        }
    }
}

export const DdbCreateGroup = CreateGroupStorageOperation.createImplementation({
    implementation: DdbCreateGroupImpl,
    dependencies: [CmsDdbGroupEntity]
});
