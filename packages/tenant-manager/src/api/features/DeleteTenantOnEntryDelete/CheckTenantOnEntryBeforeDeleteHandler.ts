import { EntryBeforeDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.js";
import { DeleteTenantUseCase } from "~/api/features/DeleteTenant/abstractions.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

/**
 * Permanently deleting a tenant entry deletes the tenant (see DeleteTenantOnEntryDeleteHandler).
 * Refuse the entry deletion up front when the current identity may not delete that tenant.
 */
class CheckTenantOnEntryBeforeDeleteHandler implements EntryBeforeDeleteEventHandler.Interface {
    constructor(private deleteTenant: DeleteTenantUseCase.Interface) {}

    async handle(event: EntryBeforeDeleteEventHandler.Event): Promise<void> {
        const { entry, model, permanent } = event.payload;

        if (model.modelId !== TENANT_MODEL_ID || !permanent) {
            return;
        }

        const result = await this.deleteTenant.canDelete(entry.entryId);
        if (result.isFail()) {
            throw result.error;
        }
    }
}

export default EntryBeforeDeleteEventHandler.createImplementation({
    implementation: CheckTenantOnEntryBeforeDeleteHandler,
    dependencies: [DeleteTenantUseCase]
});
