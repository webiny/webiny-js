import { Result } from "@webiny/feature/api";
import { Tenant } from "~/shared/Tenant.js";
import type { TenantValues } from "~/shared/Tenant.js";
import type { CmsEntryListWhereValues } from "@webiny/api-headless-cms/types/index.js";
import { TENANT_MODEL_ID } from "~/shared/constants.js";
import { TenantModelNotFoundError } from "../../domain/errors.js";
import { TenantPersistenceError } from "../../domain/errors.js";
import { ListTenantsRepository as RepositoryAbstraction } from "./abstractions.js";
import { TenantScopes } from "@webiny/api-core/exports/api/tenancy.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";

// Enough for a switcher; past this, the search narrows it down.
const LIMIT = 50;

class ListTenantsRepository implements RepositoryAbstraction.Interface {
    constructor(private tenantScopes: TenantScopes.Interface) {}

    async execute(
        input: RepositoryAbstraction.Input
    ): Promise<Result<Tenant[], RepositoryAbstraction.Error>> {
        try {
            const search = input.search?.trim();
            const valuesWhere: CmsEntryListWhereValues = { status: "enabled", isInstalled: true };
            if (search) {
                valuesWhere.name_contains = search;
            }

            // TODO: nested tenants. Like GetTenantByIdRepository, this reads the root tenant's CMS,
            //  so it lists the root's direct children only, wherever the request comes from.
            const listResult = await this.tenantScopes.withRootTenant(async scope => {
                const modelResult = await scope.resolve(GetModelUseCase).execute(TENANT_MODEL_ID);
                if (modelResult.isFail()) {
                    return Result.fail(new TenantModelNotFoundError());
                }

                const result = await scope
                    .resolve(ListLatestEntriesUseCase)
                    .execute<TenantValues>(modelResult.value, {
                        where: { values: valuesWhere },
                        limit: LIMIT
                    });
                if (result.isFail()) {
                    return Result.fail(new TenantPersistenceError(result.error as Error));
                }
                return Result.ok(result.value);
            });

            if (listResult.isFail()) {
                return Result.fail(listResult.error);
            }

            const { entries } = listResult.value;

            const tenants = entries
                .map(entry => Tenant.from({ id: entry.entryId, values: entry.values }))
                .sort((a, b) => a.values.name.localeCompare(b.values.name));

            return Result.ok(tenants);
        } catch (error) {
            return Result.fail(new TenantPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: ListTenantsRepository,
    dependencies: [TenantScopes]
});
