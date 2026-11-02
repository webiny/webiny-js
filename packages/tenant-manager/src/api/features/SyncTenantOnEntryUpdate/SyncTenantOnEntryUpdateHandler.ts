import { EntryAfterUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.js";
import { UpdateTenantUseCase } from "@webiny/api-core/features/tenancy/UpdateTenant";
import { Logger } from "@webiny/api-core/exports/api/logger.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

class SyncTenantOnEntryUpdateHandler implements EntryAfterUpdateEventHandler.Interface {
    constructor(
        private updateTenant: UpdateTenantUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async handle(event: EntryAfterUpdateEventHandler.Event): Promise<void> {
        const { entry, original, model } = event.payload;

        // Only handle tenant model updates
        if (model.modelId !== TENANT_MODEL_ID) {
            return;
        }

        const { name, description } = entry.values;

        // Status changes (enable/disable) update api-core themselves, so only sync name and description
        if (name === original.values.name && description === original.values.description) {
            return;
        }

        try {
            const result = await this.updateTenant.execute(entry.entryId, { name, description });
            if (result.isFail()) {
                this.logger.error(result.error, `Failed to update tenant ${entry.entryId}!`);
            }
        } catch (error) {
            // Log error but don't throw - we don't want to prevent CMS update
            this.logger.error(error as Error, `Failed to update tenant ${entry.entryId}!`);
        }
    }
}

export default EntryAfterUpdateEventHandler.createImplementation({
    implementation: SyncTenantOnEntryUpdateHandler,
    dependencies: [UpdateTenantUseCase, Logger]
});
