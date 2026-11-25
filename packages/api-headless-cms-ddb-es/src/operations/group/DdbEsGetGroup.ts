import type { CmsGroupStorageOperationsGetParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { GetGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/GetGroupStorageOperation.js";
import { CmsDdbEsGroupEntity } from "~/abstractions/CmsDdbEsGroupEntity.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { createKeys } from "./keys.js";

class DdbEsGetGroupImpl implements GetGroupStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsGroupEntity.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute(params: CmsGroupStorageOperationsGetParams) {
        const tenant = this.scopeTenant.getId(params.tenant);
        const keys = createKeys({ tenant, id: params.id });

        try {
            const result = await this.entity.get(keys);

            return result?.data || null;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get group.",
                ex.code || "GET_GROUP_ERROR",
                {
                    error: ex,
                    ...params,
                    keys
                }
            );
        }
    }
}

export const DdbEsGetGroup = GetGroupStorageOperation.createImplementation({
    implementation: DdbEsGetGroupImpl,
    dependencies: [CmsDdbEsGroupEntity, ScopeTenant]
});
