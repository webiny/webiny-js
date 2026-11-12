import { EntryBeforeCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById/index.js";
import { TenantAlreadyExistsError } from "~/api/domain/errors.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

/**
 * A tenant entry's id is the tenant's id. Never allow an entry for a tenant that already exists,
 * in any tenant: deleting, enabling or installing that entry would act on the existing tenant.
 */
class CheckTenantIdOnEntryBeforeCreateHandler implements EntryBeforeCreateEventHandler.Interface {
    constructor(private getTenantById: GetTenantByIdUseCase.Interface) {}

    async handle(event: EntryBeforeCreateEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        if (model.modelId !== TENANT_MODEL_ID) {
            return;
        }

        const existing = await this.getTenantById.execute(entry.entryId);
        if (existing.isOk()) {
            throw new TenantAlreadyExistsError(entry.entryId);
        }
    }
}

export default EntryBeforeCreateEventHandler.createImplementation({
    implementation: CheckTenantIdOnEntryBeforeCreateHandler,
    dependencies: [GetTenantByIdUseCase]
});
