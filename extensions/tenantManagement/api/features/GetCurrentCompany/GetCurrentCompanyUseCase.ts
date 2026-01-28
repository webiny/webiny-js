import { Result } from "webiny/api";
import { TenantContext } from "webiny/api/tenancy";
import { Company } from "../../domain/Company.js";
import { GetCompanyByIdUseCase } from "../GetCompanyById/abstractions.js";
import { GetCurrentCompanyUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetCurrentCompanyUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private getCompanyByIdUseCase: GetCompanyByIdUseCase.Interface
    ) {}

    async execute(): Promise<Result<Company, UseCaseAbstraction.Error>> {
        // Get the current tenant from context
        const currentTenant = this.tenantContext.getTenant();

        // Use the tenant ID to fetch the company
        const result = await this.getCompanyByIdUseCase.execute(currentTenant.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: GetCurrentCompanyUseCase,
    dependencies: [TenantContext, GetCompanyByIdUseCase]
});
