import { Result } from "webiny/api";
import { EntryId } from "webiny/api/cms/entry";
import { CreateTenantUseCase, DeleteTenantUseCase, InstallTenantUseCase } from "webiny/api/tenancy";
import { Company } from "../../domain/Company.js";
import {
    TenantCreationError,
    TenantInstallationError,
    CompanyUpdateError
} from "../../domain/errors.js";
import { GetCompanyByIdUseCase } from "../GetCompanyById/abstractions.js";
import { UpdateCompanyUseCase } from "../UpdateCompany/abstractions.js";
import { CreateAndInstallTenantUseCase as UseCaseAbstraction } from "./abstractions.js";

class CreateAndInstallTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private getCompanyByIdUseCase: GetCompanyByIdUseCase.Interface,
        private createTenantUseCase: CreateTenantUseCase.Interface,
        private deleteTenantUseCase: DeleteTenantUseCase.Interface,
        private installTenantUseCase: InstallTenantUseCase.Interface,
        private updateCompanyUseCase: UpdateCompanyUseCase.Interface
    ) {}

    async execute(companyId: string): Promise<Result<Company, UseCaseAbstraction.Error>> {
        try {
            const entryId = EntryId.from(companyId);

            // Get company details
            const companyResult = await this.getCompanyByIdUseCase.execute(entryId.id);
            if (companyResult.isFail()) {
                return Result.fail(companyResult.error);
            }
            const company = companyResult.value;

            // Create tenant
            const tenantResult = await this.createTenantUseCase.execute({
                id: entryId.id,
                name: company.values.name,
                parent: "root",
                description: company.values.name,
                tags: []
            });

            if (tenantResult.isFail()) {
                return Result.fail(new TenantCreationError(tenantResult.error));
            }
            const tenant = tenantResult.value;

            // Install tenant
            const installResult = await this.installTenantUseCase.execute({
                tenant: tenant,
                installationInput: []
            });

            if (installResult.isFail()) {
                // Delete tenant if installation failed.
                await this.deleteTenantUseCase.execute(tenant.id);

                return Result.fail(new TenantInstallationError(installResult.error));
            }

            // Update company entry to mark as installed
            const updateResult = await this.updateCompanyUseCase.execute(entryId.id, {
                isInstalled: true
            });

            if (updateResult.isFail()) {
                return Result.fail(new CompanyUpdateError(updateResult.error));
            }

            // Return updated company
            return Result.ok(updateResult.value);
        } catch (error) {
            return Result.fail(new TenantCreationError(error as Error));
        }
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: CreateAndInstallTenantUseCase,
    dependencies: [
        GetCompanyByIdUseCase,
        CreateTenantUseCase,
        DeleteTenantUseCase,
        InstallTenantUseCase,
        UpdateCompanyUseCase
    ]
});
