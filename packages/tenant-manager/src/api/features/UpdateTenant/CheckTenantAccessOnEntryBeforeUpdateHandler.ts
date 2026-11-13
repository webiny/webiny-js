import { EntryBeforeUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.js";
import { TenantAccess } from "~/api/features/TenantAccess/abstractions.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

/**
 * The tenant model is a regular content model, so content entry permissions alone would allow
 * updating tenant entries. Updating one requires the Tenant Manager permission.
 *
 * Only the permission is checked: an entry may exist before its tenant does, so there is no
 * tenant to check the parent of.
 */
class CheckTenantAccessOnEntryBeforeUpdateHandler
    implements EntryBeforeUpdateEventHandler.Interface
{
    constructor(private tenantAccess: TenantAccess.Interface) {}

    async handle(event: EntryBeforeUpdateEventHandler.Event): Promise<void> {
        const { model } = event.payload;

        if (model.modelId !== TENANT_MODEL_ID) {
            return;
        }

        const access = await this.tenantAccess.canCreate();
        if (access.isFail()) {
            throw access.error;
        }
    }
}

export default EntryBeforeUpdateEventHandler.createImplementation({
    implementation: CheckTenantAccessOnEntryBeforeUpdateHandler,
    dependencies: [TenantAccess]
});
