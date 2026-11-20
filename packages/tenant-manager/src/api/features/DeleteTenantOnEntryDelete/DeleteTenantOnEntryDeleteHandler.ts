import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.js";
import { DeleteTenantUseCase } from "~/api/features/DeleteTenant/abstractions.js";
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

        // Checks were already run before the entry was deleted; this runs them again.
        const result = await this.deleteTenant.execute(entry.entryId);
        if (result.isFail()) {
            // Log error but don't throw - the CMS entry is already deleted.
            console.error(`Failed to delete tenant ${entry.entryId}!`, result.error);
        }
    }
}

export default EntryAfterDeleteEventHandler.createImplementation({
    implementation: DeleteTenantOnEntryDeleteHandler,
    dependencies: [DeleteTenantUseCase]
});
