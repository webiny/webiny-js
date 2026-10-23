import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ResolveIdentityTenantsUseCase as Abstraction } from "./abstractions.js";
import { GetTenantByIdUseCase } from "~/features/tenancy/GetTenantById/index.js";
import { FindUserRecordsUseCase } from "~/features/users/FindUserRecords/index.js";
import { UserStorageError } from "~/features/users/shared/errors.js";
import type { Tenant } from "~/types/tenancy.js";

class ResolveIdentityTenantsUseCaseImpl implements Abstraction.Interface {
    constructor(
        private findUserRecords: FindUserRecordsUseCase.Interface,
        private getTenantById: GetTenantByIdUseCase.Interface
    ) {}

    async execute(identityId: string): Abstraction.Return {
        const usersResult = await this.findUserRecords.execute(identityId);
        if (usersResult.isFail()) {
            return Result.fail(usersResult.error);
        }

        const tenantIds = [...new Set(usersResult.value.map(user => user.tenant))];

        let tenants: Array<Tenant | null>;
        try {
            tenants = await Promise.all(tenantIds.map(id => this.loadTenant(id)));
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }

        const identityTenants = tenants
            // Disabled tenants can't be logged into, and uninstalled tenants have no users yet.
            .filter((tenant): tenant is Tenant => {
                return !!tenant && tenant.isInstalled && tenant.status !== "disabled";
            })
            .map(tenant => ({ id: tenant.id, name: tenant.name }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return Result.ok(identityTenants);
    }

    private async loadTenant(id: string): Promise<Tenant | null> {
        const result = await this.getTenantById.execute(id);
        if (result.isOk()) {
            return result.value;
        }

        // A record left behind by a deleted tenant.
        if (result.error.type === "NOT_FOUND") {
            return null;
        }

        throw result.error.cause;
    }
}

export const ResolveIdentityTenantsUseCase = createImplementation({
    abstraction: Abstraction,
    implementation: ResolveIdentityTenantsUseCaseImpl,
    dependencies: [FindUserRecordsUseCase, GetTenantByIdUseCase]
});
