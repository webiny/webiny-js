import type { CmsGroupStorageOperationsCreateParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { CreateGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/CreateGroupStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsDdbGroupEntity } from "~/abstractions/CmsDdbGroupEntity.js";
import { createKeys, createType } from "./keys.js";

class DdbCreateGroupImpl implements CreateGroupStorageOperation.Interface {
    constructor(
        private entity: CmsDdbGroupEntity.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute(params: CmsGroupStorageOperationsCreateParams) {
        const { group } = params;
        const tenant = this.scopeTenant.getId();
        const keys = createKeys({ tenant, id: group.id });
        try {
            await this.entity.put({
                data: { ...group, tenant },
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
    dependencies: [CmsDdbGroupEntity, ScopeTenant]
});
