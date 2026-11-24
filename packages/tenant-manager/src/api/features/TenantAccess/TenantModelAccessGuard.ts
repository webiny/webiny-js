import { ModelAccessGuard } from "@webiny/api-headless-cms/features/contentModel/ModelAccessGuard/index.js";
import { TenantAccess } from "./abstractions.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

/**
 * The tenant model is a regular content model, so Headless CMS permissions alone would give access
 * to tenant entries. Accessing the model and its entries requires the Tenant Manager permission.
 */
class TenantModelAccessGuard implements ModelAccessGuard.Interface {
    constructor(private tenantAccess: TenantAccess.Interface) {}

    canHandle(model: { modelId: string }): boolean {
        return model.modelId === TENANT_MODEL_ID;
    }

    async canAccess(): Promise<boolean> {
        const access = await this.tenantAccess.canCreate();

        return access.isOk();
    }
}

export default ModelAccessGuard.createImplementation({
    implementation: TenantModelAccessGuard,
    dependencies: [TenantAccess]
});
