import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ResolveIdentityTenantsUseCase as Abstraction } from "./abstractions.js";
import { ListTenantsUseCase } from "~/features/tenancy/ListTenants/index.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";

class ResolveIdentityTenantsUseCaseImpl implements Abstraction.Interface {
    constructor(
        private listTenants: ListTenantsUseCase.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(identityId: string): Abstraction.Return {
        const tenantsResult = await this.listTenants.execute();
        if (tenantsResult.isFail()) {
            return Result.ok([]);
        }

        // Disabled tenants can't be logged into, and uninstalled tenants have no users yet.
        const tenants = tenantsResult.value.filter(tenant => {
            return tenant.isInstalled && tenant.status !== "disabled";
        });

        if (tenants.length === 0) {
            return Result.ok([]);
        }

        const usersResult = await this.repository.getUserAcrossTenants({
            id: identityId,
            tenants: tenants.map(tenant => tenant.id)
        });

        if (usersResult.isFail()) {
            return Result.fail(usersResult.error);
        }

        const userTenants = new Set(usersResult.value.map(user => user.tenant));

        const identityTenants = tenants
            .filter(tenant => userTenants.has(tenant.id))
            .map(tenant => ({ id: tenant.id, name: tenant.name }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return Result.ok(identityTenants);
    }
}

export const ResolveIdentityTenantsUseCase = createImplementation({
    abstraction: Abstraction,
    implementation: ResolveIdentityTenantsUseCaseImpl,
    dependencies: [ListTenantsUseCase, AdminUsersRepository]
});
