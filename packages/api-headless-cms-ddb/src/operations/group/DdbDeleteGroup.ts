import type { CmsGroupStorageOperationsDeleteParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { DeleteGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/DeleteGroupStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsDdbGroupEntity } from "~/abstractions/CmsDdbGroupEntity.js";
import { createKeys } from "./keys.js";

class DdbDeleteGroupImpl implements DeleteGroupStorageOperation.Interface {
    constructor(
        private entity: CmsDdbGroupEntity.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute(params: CmsGroupStorageOperationsDeleteParams) {
        const { group } = params;
        const tenant = this.scopeTenant.getId(group.tenant);
        const keys = createKeys({ tenant, id: group.id });
        try {
            await this.entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete group.",
                ex.code || "DELETE_GROUP_ERROR",
                { error: ex, group, keys }
            );
        }
    }
}

export const DdbDeleteGroup = DeleteGroupStorageOperation.createImplementation({
    implementation: DdbDeleteGroupImpl,
    dependencies: [CmsDdbGroupEntity, ScopeTenant]
});
