import { Result } from "@webiny/feature/api";
import { EntryId } from "@webiny/api-headless-cms/domain/contentEntry/EntryId.js";
import { Tenant } from "~/shared/Tenant.js";
import {
    TenantCreationError,
    TenantInstallationError,
    TenantUpdateError
} from "../../domain/errors.js";
import { GetTenantByIdUseCase } from "../GetTenantById/abstractions.js";
import { UpdateTenantUseCase } from "../UpdateTenant/abstractions.js";
import { CreateAndInstallTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import * as Tenancy from "@webiny/api-core/exports/api/tenancy.js";

class CreateAndInstallTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
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
            // Update the core tenant, and set it to `active`
            await this.coreUpdateTenant.execute(tenant.id, {
                name: tenant.values.name,
                description: tenant.values.description,
                status: "active"
            });

            // Mark tenant installed, and exit early.
            return this.markTenantInstalled(tenant);
        }

        // Create tenant
        const createTenantResult = await this.coreCreateTenant.execute({
            id: entryId.id,
            name: tenant.values.name,
            parent: "root",
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
        GetTenantByIdUseCase,
        UpdateTenantUseCase,
        Tenancy.GetTenantByIdUseCase,
        Tenancy.CreateTenantUseCase,
        Tenancy.UpdateTenantUseCase,
        Tenancy.DeleteTenantUseCase,
        Tenancy.InstallTenantUseCase
    ]
});
