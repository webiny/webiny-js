import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { FindUserRecordsUseCase as Abstraction } from "./abstractions.js";
import { ListTenantsUseCase } from "~/features/tenancy/ListTenants/index.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { UserStorageError } from "~/features/users/shared/errors.js";
import type { AdminUser } from "~/features/users/shared/types.js";
import type { Tenant } from "~/types/tenancy.js";
import { TenantScopes } from "~/features/tenancy/TenantScopes/abstractions.js";

class FindUserRecordsUseCaseImpl implements Abstraction.Interface {
    constructor(
        private listTenants: ListTenantsUseCase.Interface,
        private repository: AdminUsersRepository.Interface,
        private tenantScopes: TenantScopes.Interface
    ) {}

    async execute(id: string, options: Abstraction.Options = {}): Abstraction.Return {
        const indexedResult = await this.repository.listUserRecords({ id });
        if (indexedResult.isFail()) {
            return Result.fail(indexedResult.error);
        }

        const indexed = indexedResult.value;
        if (indexed.length > 0 && !options.exhaustive) {
            return Result.ok(indexed);
        }

        const probedResult = await this.probeAllTenants(id);
        if (probedResult.isFail()) {
            return Result.fail(probedResult.error);
        }

        const { users, tenants } = probedResult.value;
        const indexedTenants = new Set(indexed.map(user => user.tenant));
        const unindexed = users.filter(user => !indexedTenants.has(user.tenant));

        // One tenant at a time: each rewrite enters that tenant's scope, and a scope only goes idle
        // (and can be released) once its rewrite is done.
        const tenantsById = new Map(tenants.map(tenant => [tenant.id, tenant]));
        for (const user of unindexed) {
            await this.addToIndex(user, tenantsById.get(user.tenant));
        }

        return Result.ok([...indexed, ...unindexed]);
    }

    /**
     * Rewriting a record adds the index keys. It's rewritten in its own tenant's scope, the only
     * storage that writes that tenant's records. A failed write only means the next lookup probes again.
     */
    private async addToIndex(user: AdminUser, tenant: Tenant | undefined): Promise<void> {
        if (!tenant) {
            return;
        }
        try {
            await this.tenantScopes.withTenant(tenant, async scope => {
                await scope.resolve(AdminUsersRepository).update(user);
            });
        } catch {
            // Like a failed write: the next lookup probes again.
        }
    }

    private async probeAllTenants(
        id: string
    ): Promise<Result<{ users: AdminUser[]; tenants: Tenant[] }, Abstraction.Error>> {
        let tenantsResult: Awaited<ReturnType<ListTenantsUseCase.Interface["execute"]>>;
        try {
            tenantsResult = await this.listTenants.execute();
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }

        if (tenantsResult.isFail()) {
            return Result.fail(new UserStorageError(tenantsResult.error as Error));
        }

        // Uninstalled tenants have no users yet.
        const tenants = tenantsResult.value.filter(tenant => tenant.isInstalled);
        if (tenants.length === 0) {
            return Result.ok({ users: [], tenants });
        }

        const usersResult = await this.repository.getUserAcrossTenants({
            id,
            tenants: tenants.map(tenant => tenant.id)
        });
        if (usersResult.isFail()) {
            return Result.fail(usersResult.error);
        }
        return Result.ok({ users: usersResult.value, tenants });
    }
}

export const FindUserRecordsUseCase = createImplementation({
    abstraction: Abstraction,
    implementation: FindUserRecordsUseCaseImpl,
    dependencies: [ListTenantsUseCase, AdminUsersRepository, TenantScopes]
});
