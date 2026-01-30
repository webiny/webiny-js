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
import {
    CreateTenantUseCase,
    DeleteTenantUseCase,
    InstallTenantUseCase
} from "@webiny/api-core/exports/api/tenancy.js";

class CreateAndInstallTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private getTenantByIdUseCase: GetTenantByIdUseCase.Interface,
        private createTenantUseCase: CreateTenantUseCase.Interface,
        private deleteTenantUseCase: DeleteTenantUseCase.Interface,
        private installTenantUseCase: InstallTenantUseCase.Interface,
        private updateTenantUseCase: UpdateTenantUseCase.Interface
    ) {}

    async execute(tenantId: string): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        const entryId = EntryId.from(tenantId);

        // Get tenant details
        const tenantResult = await this.getTenantByIdUseCase.execute(entryId.id);
        if (tenantResult.isFail()) {
            return Result.fail(tenantResult.error);
        }
        const tenant = tenantResult.value;

        // Create tenant
        const createTenantResult = await this.createTenantUseCase.execute({
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
        const installResult = await this.installTenantUseCase.execute({
            tenant: createdTenant,
            installationInput: []
        });

        if (installResult.isFail()) {
            // Delete tenant if installation failed.
            await this.deleteTenantUseCase.execute(createdTenant.id);

            return Result.fail(new TenantInstallationError(installResult.error));
        }

        // Update tenant entry to mark as installed
        const updateResult = await this.updateTenantUseCase.execute(entryId.id, {
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
        CreateTenantUseCase,
        DeleteTenantUseCase,
        InstallTenantUseCase,
        UpdateTenantUseCase
    ]
});
