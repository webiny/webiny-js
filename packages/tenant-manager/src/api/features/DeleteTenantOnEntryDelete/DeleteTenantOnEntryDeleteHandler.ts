import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.js";
import { DeleteTenantUseCase } from "@webiny/api-core/features/tenancy/DeleteTenant";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

class DeleteTenantOnEntryDeleteHandler implements EntryAfterDeleteEventHandler.Interface {
    constructor(private deleteTenant: DeleteTenantUseCase.Interface) {}

    async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        // Only handle tenant model deletions
        if (model.modelId !== TENANT_MODEL_ID) {
            return;
        }

        // Only handle permanent deletions
        if (!event.payload.permanent) {
            return;
        }

        try {
            // Delete the tenant from api-core
            await this.deleteTenant.execute(entry.entryId);
        } catch (error) {
            // Log error but don't throw - we don't want to prevent CMS deletion
            console.error(`Failed to delete tenant ${entry.entryId}!`, error);
        }
    }
}

export default EntryAfterDeleteEventHandler.createImplementation({
    implementation: DeleteTenantOnEntryDeleteHandler,
    dependencies: [DeleteTenantUseCase]
});
