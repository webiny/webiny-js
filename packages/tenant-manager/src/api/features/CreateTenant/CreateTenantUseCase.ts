import {
    CreateTenantUseCase as UseCaseAbstraction,
    ICreateTenantInput,
    CreateTenantRepository
} from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import { TenantAccess } from "~/api/features/TenantAccess/abstractions.js";
import { Tenant } from "~/shared/Tenant.js";
import { TenantId } from "~/api/domain/TenantId.js";

class CreateTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private tenantAccess: TenantAccess.Interface,
        private repository: CreateTenantRepository.Interface
    ) {}

    async execute(input: ICreateTenantInput): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        // Authorization checks
        const access = await this.tenantAccess.canCreate();
        if (access.isFail()) {
            return Result.fail(access.error);
        }

        const tenant = Tenant.from({
            id: TenantId.from(input.id),
            values: {
                name: input.name,
                description: input.description || "(no description)",
                extensions: input.extensions ?? {},
                status: "disabled",
                isInstalled: false
            }
        });

        // Create the tenant
        const result = await this.repository.execute(tenant);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: CreateTenantUseCase,
    dependencies: [TenantAccess, CreateTenantRepository]
});
