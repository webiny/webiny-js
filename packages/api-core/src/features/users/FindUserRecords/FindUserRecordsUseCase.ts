import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { FindUserRecordsUseCase as Abstraction } from "./abstractions.js";
import { ListTenantsUseCase } from "~/features/tenancy/ListTenants/index.js";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";
import { UserStorageError } from "~/features/users/shared/errors.js";
import type { AdminUser } from "~/features/users/shared/types.js";

class FindUserRecordsUseCaseImpl implements Abstraction.Interface {
    constructor(
        private listTenants: ListTenantsUseCase.Interface,
        private repository: AdminUsersRepository.Interface
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

        const indexedTenants = new Set(indexed.map(user => user.tenant));
        const unindexed = probedResult.value.filter(user => !indexedTenants.has(user.tenant));

        // Rewriting a record adds the index keys. A failed write only means the next lookup probes again.
        await Promise.all(unindexed.map(user => this.repository.update(user)));

        return Result.ok([...indexed, ...unindexed]);
    }

    private async probeAllTenants(id: string): Promise<Result<AdminUser[], Abstraction.Error>> {
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
            return Result.ok([]);
        }

        return this.repository.getUserAcrossTenants({
            id,
            tenants: tenants.map(tenant => tenant.id)
        });
    }
}

export const FindUserRecordsUseCase = createImplementation({
    abstraction: Abstraction,
    implementation: FindUserRecordsUseCaseImpl,
    dependencies: [ListTenantsUseCase, AdminUsersRepository]
});
