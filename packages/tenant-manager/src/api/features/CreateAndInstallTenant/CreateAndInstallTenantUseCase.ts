import { Result } from "@webiny/feature/api";
import { EntryId } from "@webiny/api-headless-cms/domain/contentEntry/EntryId.js";
import { Tenant } from "~/shared/Tenant.js";
import {
    TenantCreationError,
    TenantInstallationError,
    TenantUpdateError,
    TenantNotFoundError
} from "../../domain/errors.js";
import { GetTenantByIdUseCase } from "../GetTenantById/abstractions.js";
import { UpdateTenantUseCase } from "../UpdateTenant/abstractions.js";
import { CreateAndInstallTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import * as Tenancy from "@webiny/api-core/exports/api/tenancy.js";
import { TenantAccess } from "~/api/features/TenantAccess/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/abstractions.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";

class CreateAndInstallTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private tenantAccess: TenantAccess.Interface,
        private tenantContext: Tenancy.TenantContext.Interface,
        private getModel: GetModelUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        // Tenant manager deps
        private getTenantByIdUseCase: GetTenantByIdUseCase.Interface,
        private updateTenantUseCase: UpdateTenantUseCase.Interface,
        // Core tenancy deps
        private coreGetTenantById: Tenancy.GetTenantByIdUseCase.Interface,
        private coreCreateTenant: Tenancy.CreateTenantUseCase.Interface,
        private coreUpdateTenant: Tenancy.UpdateTenantUseCase.Interface,
        private coreDeleteTenant: Tenancy.DeleteTenantUseCase.Interface,
        private coreInstallTenant: Tenancy.InstallTenantUseCase.Interface
    ) {}

    async execute(tenantId: string): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        // Authorization checks
        const access = await this.tenantAccess.canCreate();
        if (access.isFail()) {
            return Result.fail(access.error);
        }

        const entryId = EntryId.from(tenantId);

        // Get tenant details
        const tenantResult = await this.getTenantByIdUseCase.execute(entryId.id);
        if (tenantResult.isFail()) {
            return Result.fail(tenantResult.error);
        }
        const tenant = tenantResult.value;

        const existingTenantResult = await this.coreGetTenantById.execute(tenant.id);

        // If core tenant already exists with this same ID, we mark the Tenant Manager tenant installed.
        if (existingTenantResult.isOk()) {
            // Only a child of the current tenant may be taken over.
            const canManage = await this.tenantAccess.canManage(tenant.id);
            if (canManage.isFail()) {
                return Result.fail(canManage.error);
            }

            // Update the core tenant, and set it to `active`
            await this.coreUpdateTenant.execute(tenant.id, {
                name: tenant.values.name,
                description: tenant.values.description,
                status: "enabled"
            });

            // Mark tenant installed, and exit early.
            return this.markTenantInstalled(tenant);
        }

        // A new tenant can only be installed from the tenant that holds its entry, so a sub-tenant
        // can't install (and take over) an entry created by another tenant.
        const ownEntry = await this.hasEntryInCurrentTenant(entryId.toString());
        if (!ownEntry) {
            return Result.fail(new TenantNotFoundError(entryId.id));
        }

        // Create tenant
        const createTenantResult = await this.coreCreateTenant.execute({
            id: entryId.id,
            name: tenant.values.name,
            // New tenants are children of the tenant they are created from.
            parent: this.tenantContext.getTenant().id,
            description: tenant.values.name,
            tags: []
        });

        if (createTenantResult.isFail()) {
            return Result.fail(new TenantCreationError(createTenantResult.error));
        }
        const createdTenant = createTenantResult.value;

        // Install tenant
        const installResult = await this.coreInstallTenant.execute({
            tenant: createdTenant,
            installationInput: []
        });

        if (installResult.isFail()) {
            // Delete tenant if installation failed.
            await this.coreDeleteTenant.execute(createdTenant.id);

            return Result.fail(new TenantInstallationError(installResult.error));
        }

        return this.markTenantInstalled(tenant);
    }

    private async hasEntryInCurrentTenant(id: string): Promise<boolean> {
        const modelResult = await this.getModel.execute(TENANT_MODEL_ID);
        if (modelResult.isFail()) {
            return false;
        }
        const entryResult = await this.getEntryById.execute(modelResult.value, id);
        return entryResult.isOk();
    }

    private async markTenantInstalled(tenant: Tenant) {
        // Update tenant entry to mark as installed
        const updateResult = await this.updateTenantUseCase.execute(tenant.id, {
            status: "enabled",
            isInstalled: true
        });

        if (updateResult.isFail()) {
            return Result.fail(new TenantUpdateError(updateResult.error));
        }

        // Return updated tenant
        return Result.ok(updateResult.value);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: CreateAndInstallTenantUseCase,
    dependencies: [
        TenantAccess,
        Tenancy.TenantContext,
        GetModelUseCase,
        GetEntryByIdUseCase,
        GetTenantByIdUseCase,
        UpdateTenantUseCase,
        Tenancy.GetTenantByIdUseCase,
        Tenancy.CreateTenantUseCase,
        Tenancy.UpdateTenantUseCase,
        Tenancy.DeleteTenantUseCase,
        Tenancy.InstallTenantUseCase
    ]
});
