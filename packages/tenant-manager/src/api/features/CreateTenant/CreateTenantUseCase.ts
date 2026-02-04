import {
    CreateTenantUseCase as UseCaseAbstraction,
    ICreateTenantInput,
    CreateTenantRepository
} from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { Tenant } from "~/shared/Tenant.js";
import { TenantId } from "~/api/domain/TenantId.js";

class CreateTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: CreateTenantRepository.Interface
    ) {}

    async execute(input: ICreateTenantInput): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        // Authorization checks
        const identity = this.identityContext.getIdentity();
        if (!identity.isAdmin() || !this.identityContext.getPermission("tm.tenant")) {
            return Result.fail(
                new NotAuthorizedError({
                    message: "Not authorized to create tenants!"
                })
            );
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
    dependencies: [IdentityContext, CreateTenantRepository]
});
