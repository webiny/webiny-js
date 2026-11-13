import { Tenant } from "~/shared/Tenant.js";
import { GetTenantByIdUseCase } from "../GetTenantById/abstractions.js";
import { GetCurrentTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";

class GetCurrentTenantUseCase implements UseCaseAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private identityContext: IdentityContext.Interface,
        private getTenantByIdUseCase: GetTenantByIdUseCase.Interface
    ) {}

    async execute(): Promise<Result<Tenant, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        // Get the current tenant from context
        const currentTenant = this.tenantContext.getTenant();

        const result = await this.identityContext.withoutAuthorization(() => {
            return this.getTenantByIdUseCase.execute(currentTenant.id);
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        // Security: the tenant comes from the caller-chosen `x-tenant` header, so an identity
        // without access to this tenant only gets its ID and name, not the full entry.
        if (!(await this.hasAccessToCurrentTenant())) {
            return Result.ok(this.toPublicTenant(result.value));
        }

        return Result.ok(result.value);
    }

    private async hasAccessToCurrentTenant(): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return true;
        }

        // `aacl` is a license flag added to every identity's permissions, not an actual permission.
        const permissions = await this.identityContext.listPermissions();
        return permissions.some(permission => permission.name !== "aacl");
    }

    private toPublicTenant(tenant: Tenant): Tenant {
        return Tenant.from({
            id: tenant.id,
            values: {
                name: tenant.values.name,
                description: "",
                isInstalled: tenant.values.isInstalled,
                status: tenant.values.status,
                extensions: {}
            }
        });
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: GetCurrentTenantUseCase,
    dependencies: [TenantContext, IdentityContext, GetTenantByIdUseCase]
});
